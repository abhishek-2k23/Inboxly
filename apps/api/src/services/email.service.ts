import crypto from "node:crypto";
import { GmailSchema } from "@corsair-dev/gmail";
import type { GmailEndpointInputs, GmailEndpointOutputs } from "@corsair-dev/gmail";
import type { EmailAttachment, EmailSearchResult, EmailSummary } from "@repo/shared";
import type { PluginEntityClient } from "corsair/orm";
import { sql } from "drizzle-orm";
import type { z } from "zod";
import { db } from "../db/client.js";
import { corsair, toTenantId } from "../lib/corsair.js";
import { findHeader, parseEmailContent } from "../lib/gmail-message.js";
import { markdownToHtml } from "../lib/markdown.js";
import { MAX_ATTACHMENTS_PER_EMAIL, MAX_TOTAL_ATTACHMENT_BYTES } from "./account.service.js";
import { openai } from "../lib/openai.js";
import { emailAiMetaModel } from "../models/email.model.js";

/** Thrown when an attachment violates the plan/Gmail size limits. Surfaced as a 413. */
export class AttachmentTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttachmentTooLargeError";
  }
}

function formatMb(bytes: number): string {
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}

/** Actual decoded byte length of base64 content (don't trust the client-reported `size`). */
function decodedByteLength(base64: string): number {
  return Buffer.byteLength(base64, "base64");
}

/**
 * Enforces the per-file plan cap plus the request-bounding count/total ceilings.
 * Uses the *decoded* size of the base64 payload, not the client's `size` field.
 */
function assertAttachmentsWithinLimits(
  attachments: EmailAttachment[],
  maxBytesPerFile: number,
): void {
  if (attachments.length > MAX_ATTACHMENTS_PER_EMAIL) {
    throw new AttachmentTooLargeError(
      `You can attach up to ${MAX_ATTACHMENTS_PER_EMAIL} files per email.`,
    );
  }
  let total = 0;
  for (const att of attachments) {
    const bytes = decodedByteLength(att.data);
    total += bytes;
    if (bytes > maxBytesPerFile) {
      throw new AttachmentTooLargeError(
        `"${att.filename}" is ${formatMb(bytes)}. Your plan allows files up to ${formatMb(maxBytesPerFile)}.`,
      );
    }
  }
  if (total > MAX_TOTAL_ATTACHMENT_BYTES) {
    throw new AttachmentTooLargeError(
      `Attachments total ${formatMb(total)}, over the ${formatMb(MAX_TOTAL_ATTACHMENT_BYTES)} per-email limit.`,
    );
  }
}

/** RFC 2045 wants base64 bodies wrapped to <=76 chars per line. */
function wrapBase64(data: string): string {
  return data
    .replace(/[\r\n]/g, "")
    .replace(/.{1,76}/g, "$&\r\n")
    .trimEnd();
}

/** Strip characters that would break a MIME header parameter (CR/LF and quotes). */
function sanitizeHeaderParam(value: string): string {
  return value.replace(/[\r\n"]/g, "").trim();
}

export type GmailMessageData = z.infer<typeof GmailSchema.entities.messages>;
export type GmailDraftData = z.infer<typeof GmailSchema.entities.drafts>;

/**
 * The corsair tenant client's plugin namespaces (`client.gmail.api`/`.db`) are
 * inferred as `any` by the SDK for this plugin combination, so we cast the two
 * surfaces we use to their documented shapes at this single boundary.
 */
type GmailMessagesApi = {
  list: (
    args: GmailEndpointInputs["messagesList"],
  ) => Promise<GmailEndpointOutputs["messagesList"]>;
  get: (args: GmailEndpointInputs["messagesGet"]) => Promise<GmailEndpointOutputs["messagesGet"]>;
  send: (
    args: GmailEndpointInputs["messagesSend"],
  ) => Promise<GmailEndpointOutputs["messagesSend"]>;
  modify: (
    args: GmailEndpointInputs["messagesModify"],
  ) => Promise<GmailEndpointOutputs["messagesModify"]>;
};

type GmailMessagesDb = PluginEntityClient<typeof GmailSchema.entities.messages>;
type GmailDraftsDb = PluginEntityClient<typeof GmailSchema.entities.drafts>;

type GmailDraftsApi = {
  list: (args: GmailEndpointInputs["draftsList"]) => Promise<GmailEndpointOutputs["draftsList"]>;
  get: (args: GmailEndpointInputs["draftsGet"]) => Promise<GmailEndpointOutputs["draftsGet"]>;
  delete: (
    args: GmailEndpointInputs["draftsDelete"],
  ) => Promise<GmailEndpointOutputs["draftsDelete"]>;
  send: (args: GmailEndpointInputs["draftsSend"]) => Promise<GmailEndpointOutputs["draftsSend"]>;
};

function getMessagesApi(userId: number): GmailMessagesApi {
  return corsair.withTenant(toTenantId(userId)).gmail.api.messages as GmailMessagesApi;
}

function getMessagesDb(userId: number): GmailMessagesDb {
  return corsair.withTenant(toTenantId(userId)).gmail.db.messages as GmailMessagesDb;
}

function getDraftsApi(userId: number): GmailDraftsApi {
  return corsair.withTenant(toTenantId(userId)).gmail.api.drafts as GmailDraftsApi;
}

function getDraftsDb(userId: number): GmailDraftsDb {
  return corsair.withTenant(toTenantId(userId)).gmail.db.drafts as GmailDraftsDb;
}

const EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_SYNC_LIMIT = 20;
const MAX_SYNC_LIMIT = 500;
const SYNC_PAGE_SIZE = 50;
const DEFAULT_LIST_LIMIT = 20;
const DEFAULT_SEARCH_LIMIT = 10;

/**
 * Some entities have `internalDate` stored as a raw Gmail API value - a
 * string of epoch milliseconds (e.g. "1781080662000") - rather than the ISO
 * string `syncInbox` normally writes. Normalize both forms to ISO so callers
 * (and the SQL sort in `listInbox`) get a consistent format.
 */
function normalizeInternalDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = /^\d+$/.test(value) ? new Date(Number(value)) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toEmailSummary(data: GmailMessageData): EmailSummary {
  return {
    id: data.id,
    threadId: data.threadId,
    subject: data.subject,
    from: data.from,
    to: data.to,
    snippet: data.snippet,
    body: data.body,
    labelIds: data.labelIds,
    internalDate: normalizeInternalDate(data.internalDate),
  };
}

/**
 * Like `toEmailSummary`, but for the single-email detail view: also derives
 * `cc`/`bcc`/`bodyHtml`, which aren't part of the cached entity's top-level
 * fields (the Gmail plugin's message schema has no cc/bcc/html columns) but
 * can be recovered from the raw `payload` we additionally stash on the
 * entity for exactly this. Falls back gracefully (just missing those three
 * fields) for any entity cached before `payload` started being stored.
 */
function toEmailDetail(data: GmailMessageData): EmailSummary {
  const parsed = parseEmailContent(data.payload);
  return {
    id: data.id,
    threadId: data.threadId,
    subject: data.subject ?? parsed.subject,
    from: data.from ?? parsed.from,
    to: data.to ?? parsed.to,
    cc: parsed.cc,
    bcc: parsed.bcc,
    snippet: data.snippet,
    body: data.body ?? parsed.body,
    bodyHtml: parsed.html,
    attachments: parsed.attachments,
    labelIds: data.labelIds,
    internalDate: normalizeInternalDate(data.internalDate),
  };
}

function buildContentHash(subject: string, body: string): string {
  return crypto.createHash("sha256").update(`${subject}\n${body}`).digest("hex");
}

/**
 * Builds the date-sort `ORDER BY` expression shared by every DB-backed list
 * query below. `dataExpr` is a code-controlled SQL fragment identifying the
 * jsonb column to read (e.g. `"ce.data"`), never user input - safe to splice
 * in raw.
 *
 * Uses POSIX bracket classes, not `\d`: Postgres' regex strips the backslash
 * escape here, so `\d` matched a literal "d" and every row fell through to
 * NULL, leaving lists effectively unsorted.
 */
function dateSortExpr(dataExpr: string) {
  return sql.raw(`
    CASE
      WHEN ${dataExpr}->>'internalDate' ~ '^[0-9]+$'
        THEN to_timestamp((${dataExpr}->>'internalDate')::bigint / 1000.0)
      WHEN ${dataExpr}->>'internalDate' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
        THEN (${dataExpr}->>'internalDate')::timestamptz
      ELSE NULL
    END
  `);
}

/**
 * Shared sync loop: pages through `messagesApi.list` with the given Gmail
 * query, fetches each message's full content, and upserts/embeds it into the
 * local cache. `syncInbox`/`syncSentMail`/`syncArchivedMail` are all this
 * loop with a different Gmail query - only the query, not the storage or
 * embedding, differs per "folder".
 */
async function syncMessages(
  userId: number,
  listParams: { labelIds?: string[]; q?: string },
  maxResults: number,
): Promise<{ synced: number; embedded: number }> {
  const messagesApi = getMessagesApi(userId);
  const messagesDb = getMessagesDb(userId);
  const total = Math.min(maxResults, MAX_SYNC_LIMIT);

  let synced = 0;
  let embedded = 0;
  let pageToken: string | undefined;

  do {
    const { messages, nextPageToken } = await messagesApi.list({
      maxResults: Math.min(SYNC_PAGE_SIZE, total - synced),
      pageToken,
      ...listParams,
    });

    for (const stub of messages ?? []) {
      if (!stub.id) continue;

      const full = await messagesApi.get({ id: stub.id, format: "full" });
      const parsed = parseEmailContent(full.payload);

      const data: GmailMessageData = {
        id: full.id ?? stub.id,
        threadId: full.threadId,
        labelIds: full.labelIds,
        snippet: full.snippet,
        historyId: full.historyId,
        internalDate: full.internalDate
          ? new Date(Number(full.internalDate)).toISOString()
          : undefined,
        sizeEstimate: full.sizeEstimate,
        subject: parsed.subject,
        body: parsed.body,
        from: parsed.from,
        to: parsed.to,
        // Kept (not just the parsed fields above) so a later getEmailById
        // cache hit can still derive cc/bcc/HTML - see toEmailDetail.
        payload: full.payload,
      };

      const entity = await messagesDb.upsertByEntityId(data.id, data);
      synced += 1;

      const wasEmbedded = await emailService.embedMessage(userId, entity.id, data);
      if (wasEmbedded) embedded += 1;
    }

    pageToken = nextPageToken;
  } while (pageToken && synced < total);

  return { synced, embedded };
}

export const emailService = {
  /** Syncs INBOX-labeled mail into the local cache. */
  async syncInbox(
    userId: number,
    maxResults = DEFAULT_SYNC_LIMIT,
  ): Promise<{ synced: number; embedded: number }> {
    console.log(`[email-sync] syncInbox start for user ${userId} (maxResults=${maxResults})`);
    const result = await syncMessages(userId, { labelIds: ["INBOX"] }, maxResults);
    console.log(`[email-sync] syncInbox done for user ${userId}:`, result);
    return result;
  },

  /** Syncs SENT-labeled mail into the local cache, so the Sent tab can read it from the DB instead of fetching Gmail live. */
  async syncSentMail(
    userId: number,
    maxResults = DEFAULT_SYNC_LIMIT,
  ): Promise<{ synced: number; embedded: number }> {
    console.log(`[email-sync] syncSentMail start for user ${userId} (maxResults=${maxResults})`);
    const result = await syncMessages(userId, { labelIds: ["SENT"] }, maxResults);
    console.log(`[email-sync] syncSentMail done for user ${userId}:`, result);
    return result;
  },

  /**
   * Syncs "archived" mail into the local cache - same Gmail query
   * `listArchived` used to run live (no dedicated label, so anything that
   * isn't in one of the standard locations).
   */
  async syncArchivedMail(
    userId: number,
    maxResults = DEFAULT_SYNC_LIMIT,
  ): Promise<{ synced: number; embedded: number }> {
    console.log(
      `[email-sync] syncArchivedMail start for user ${userId} (maxResults=${maxResults})`,
    );
    const result = await syncMessages(
      userId,
      { q: "-in:inbox -in:sent -in:draft -in:trash -in:spam" },
      maxResults,
    );
    console.log(`[email-sync] syncArchivedMail done for user ${userId}:`, result);
    return result;
  },

  /**
   * Syncs Gmail drafts into the local cache. Drafts are a separate Gmail
   * entity (distinct `draftId`, wrapping a `message`), so unlike the other
   * sync* methods this writes two entity rows per draft: the underlying
   * message (so its content is searchable/listable like any other message)
   * and a `drafts` row recording the draftId -> messageId mapping that
   * `listDrafts` joins on.
   */
  async syncDraftsCache(
    userId: number,
    maxResults = DEFAULT_SYNC_LIMIT,
  ): Promise<{ synced: number }> {
    console.log(`[email-sync] syncDraftsCache start for user ${userId} (maxResults=${maxResults})`);

    const draftsApi = getDraftsApi(userId);
    const draftsDb = getDraftsDb(userId);
    const messagesDb = getMessagesDb(userId);

    const { drafts } = await draftsApi.list({ maxResults: Math.min(maxResults, MAX_SYNC_LIMIT) });

    let synced = 0;
    for (const stub of drafts ?? []) {
      if (!stub.id) continue;

      const full = await draftsApi.get({ id: stub.id, format: "full" });
      const message = full.message;

      if (message?.id) {
        const parsed = parseEmailContent(message.payload);
        const data: GmailMessageData = {
          id: message.id,
          threadId: message.threadId,
          labelIds: message.labelIds,
          snippet: message.snippet,
          historyId: message.historyId,
          internalDate: message.internalDate
            ? new Date(Number(message.internalDate)).toISOString()
            : undefined,
          sizeEstimate: message.sizeEstimate,
          subject: parsed.subject,
          body: parsed.body,
          from: parsed.from,
          to: parsed.to,
          payload: message.payload,
        };
        await messagesDb.upsertByEntityId(data.id, data);
      }

      const draftId = full.id ?? stub.id;
      const draftData: GmailDraftData = { id: draftId, messageId: message?.id };
      await draftsDb.upsertByEntityId(draftId, draftData);
      synced += 1;
    }

    console.log(`[email-sync] syncDraftsCache done for user ${userId}: synced=${synced}`);
    return { synced };
  },

  /**
   * Runs every sync above in one call - INBOX, Sent, Archived, and Drafts -
   * so one "Sync" click (or one call to `POST /api/emails/sync`) refreshes
   * everything the Inbox view's tabs can show, and `listSent`/`listArchived`/
   * `listDrafts` never need to call Gmail directly. Sequential, not
   * parallel, to keep Gmail API calls spread out rather than bursty.
   */
  async syncAll(
    userId: number,
    maxResults = DEFAULT_SYNC_LIMIT,
  ): Promise<{ synced: number; embedded: number }> {
    const inbox = await emailService.syncInbox(userId, maxResults);
    const sent = await emailService.syncSentMail(userId, maxResults);
    const archived = await emailService.syncArchivedMail(userId, maxResults);
    const drafts = await emailService.syncDraftsCache(userId, maxResults);

    return {
      synced: inbox.synced + sent.synced + archived.synced + drafts.synced,
      embedded: inbox.embedded + sent.embedded + archived.embedded,
    };
  },

  async embedMessage(
    userId: number,
    entityRowId: string,
    data: GmailMessageData,
  ): Promise<boolean> {
    const subject = data.subject ?? "";
    const body = data.body ?? data.snippet ?? "";
    if (!subject && !body) return false;

    const contentHash = buildContentHash(subject, body);
    const existing = await emailAiMetaModel.findByEntityId(userId, entityRowId);
    if (existing?.contentHash === contentHash) return false;

    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: `Subject: ${subject}\n\n${body}`.slice(0, 8000),
    });

    const embedding = embeddingResponse.data[0]?.embedding;
    if (!embedding) return false;

    await emailAiMetaModel.upsertEmbedding(userId, entityRowId, embedding, contentHash);
    return true;
  },

  async listInbox(
    userId: number,
    options: { limit?: number; offset?: number } = {},
  ): Promise<EmailSummary[]> {
    const tenantId = toTenantId(userId);
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;

    // The corsair ORM's `list()` doesn't support ordering, so query
    // corsair_entities directly to sort by the email's date (newest first).
    const result = await db.execute<{ data: GmailMessageData }>(sql`
      SELECT ce.data
      FROM corsair_entities ce
      JOIN corsair_accounts ca ON ca.id = ce.account_id
      WHERE ca.tenant_id = ${tenantId}
        AND ce.entity_type = 'messages'
        -- Only inbox mail. Drops any SENT/DRAFT/SPAM/TRASH/CHAT entities left
        -- in the cache by earlier unfiltered syncs (those have no INBOX label).
        AND ce.data->'labelIds' @> '["INBOX"]'::jsonb
      ORDER BY ${dateSortExpr("ce.data")} DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `);

    return result.rows.map((row) => toEmailSummary(row.data));
  },

  /** Lists synced Sent mail from the local cache - see syncSentMail. */
  async listSent(
    userId: number,
    options: { limit?: number; offset?: number } = {},
  ): Promise<EmailSummary[]> {
    const tenantId = toTenantId(userId);
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;

    const result = await db.execute<{ data: GmailMessageData }>(sql`
      SELECT ce.data
      FROM corsair_entities ce
      JOIN corsair_accounts ca ON ca.id = ce.account_id
      WHERE ca.tenant_id = ${tenantId}
        AND ce.entity_type = 'messages'
        AND ce.data->'labelIds' @> '["SENT"]'::jsonb
      ORDER BY ${dateSortExpr("ce.data")} DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `);

    return result.rows.map((row) => toEmailSummary(row.data));
  },

  /**
   * Lists synced "archived" mail from the local cache - see
   * syncArchivedMail. "Archived" has no dedicated label, so this mirrors the
   * same `-in:inbox -in:sent -in:draft -in:trash -in:spam` condition as a
   * label-array check instead of a live Gmail search query.
   */
  async listArchived(
    userId: number,
    options: { limit?: number; offset?: number } = {},
  ): Promise<EmailSummary[]> {
    const tenantId = toTenantId(userId);
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;

    const result = await db.execute<{ data: GmailMessageData }>(sql`
      SELECT ce.data
      FROM corsair_entities ce
      JOIN corsair_accounts ca ON ca.id = ce.account_id
      WHERE ca.tenant_id = ${tenantId}
        AND ce.entity_type = 'messages'
        AND NOT (ce.data->'labelIds' ?| array['INBOX', 'SENT', 'DRAFT', 'TRASH', 'SPAM'])
      ORDER BY ${dateSortExpr("ce.data")} DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `);

    return result.rows.map((row) => toEmailSummary(row.data));
  },

  /**
   * Lists synced Gmail drafts from the local cache - see syncDraftsCache.
   * Joins the `drafts` entity (draftId -> messageId) to the underlying
   * `messages` entity for the actual content; drafts whose message hasn't
   * been synced yet (shouldn't normally happen - syncDraftsCache writes both
   * together) are skipped rather than returned with missing content.
   */
  async listDrafts(
    userId: number,
    options: { limit?: number; offset?: number } = {},
  ): Promise<EmailSummary[]> {
    const tenantId = toTenantId(userId);
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;

    const result = await db.execute<{ draft_id: string; data: GmailMessageData | null }>(sql`
      SELECT cd.entity_id AS draft_id, cm.data
      FROM corsair_entities cd
      JOIN corsair_accounts ca ON ca.id = cd.account_id
      LEFT JOIN corsair_entities cm
        ON cm.account_id = cd.account_id
        AND cm.entity_type = 'messages'
        AND cm.entity_id = cd.data->>'messageId'
      WHERE ca.tenant_id = ${tenantId}
        AND cd.entity_type = 'drafts'
      ORDER BY ${dateSortExpr("cm.data")} DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `);

    return result.rows
      .filter((row): row is { draft_id: string; data: GmailMessageData } => row.data !== null)
      .map((row) => ({ ...toEmailSummary(row.data), draftId: row.draft_id }));
  },

  async searchInbox(
    userId: number,
    query: string,
    limit = DEFAULT_SEARCH_LIMIT,
  ): Promise<EmailSearchResult[]> {
    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query,
    });

    const embedding = embeddingResponse.data[0]?.embedding;
    if (!embedding) return [];

    const matches = await emailAiMetaModel.searchByEmbedding(userId, embedding, limit);
    if (matches.length === 0) return [];

    const messagesDb = getMessagesDb(userId);
    const entities = await Promise.all(matches.map((match) => messagesDb.findById(match.entityId)));

    const results: EmailSearchResult[] = [];
    entities.forEach((entity, index) => {
      if (!entity) return;
      results.push({ ...toEmailSummary(entity.data), similarity: matches[index]!.similarity });
    });

    return results;
  },

  /**
   * Fetches the most recent inbox messages from the local cache (same source
   * as `listInbox`) for the AI assistant's "recent" mode - previously this
   * fetched directly from Gmail on every call; now it shares the synced
   * cache like everything else, so the assistant's answers stay consistent
   * with what the Inbox view shows.
   */
  async listRecentFromInbox(userId: number, limit = DEFAULT_LIST_LIMIT): Promise<EmailSummary[]> {
    return emailService.listInbox(userId, { limit });
  },

  /**
   * Archives a message by removing its INBOX label via Gmail, then updates
   * the cached entity in place with the new labels (rather than deleting it)
   * - it now naturally falls out of `listInbox`'s filter and into
   * `listArchived`'s, both of which just read this same cache.
   */
  async archiveEmail(userId: number, id: string): Promise<EmailSummary | null> {
    const messagesApi = getMessagesApi(userId);
    const messagesDb = getMessagesDb(userId);

    const updated = await messagesApi.modify({ id, removeLabelIds: ["INBOX"] });
    if (!updated.id) return null;

    const parsed = parseEmailContent(updated.payload);
    const internalDate = updated.internalDate
      ? new Date(Number(updated.internalDate)).toISOString()
      : undefined;

    const data: GmailMessageData = {
      id: updated.id,
      threadId: updated.threadId,
      labelIds: updated.labelIds,
      snippet: updated.snippet,
      historyId: updated.historyId,
      internalDate,
      sizeEstimate: updated.sizeEstimate,
      subject: parsed.subject,
      body: parsed.body,
      from: parsed.from,
      to: parsed.to,
      payload: updated.payload,
    };
    await messagesDb.upsertByEntityId(id, data);

    return {
      id: updated.id,
      threadId: updated.threadId,
      subject: parsed.subject,
      from: parsed.from,
      to: parsed.to,
      cc: parsed.cc,
      bcc: parsed.bcc,
      snippet: updated.snippet,
      body: parsed.body,
      bodyHtml: parsed.html,
      labelIds: updated.labelIds,
      internalDate: internalDate ?? null,
    };
  },

  /**
   * Cache-first, same pattern as calendarService.getEvent: check the local
   * cache (any sync* path may have already written this message) before
   * falling back to a live Gmail fetch, which then backfills the cache so
   * the next lookup for this email doesn't need Gmail at all.
   */
  async getEmailById(userId: number, id: string): Promise<EmailSummary | null> {
    const messagesDb = getMessagesDb(userId);

    const cached = await messagesDb.findByEntityId(id);
    if (cached) return toEmailDetail(cached.data);

    const messagesApi = getMessagesApi(userId);
    const full = await messagesApi.get({ id, format: "full" });
    if (!full.id) return null;

    const parsed = parseEmailContent(full.payload);
    const data: GmailMessageData = {
      id: full.id,
      threadId: full.threadId,
      labelIds: full.labelIds,
      snippet: full.snippet,
      historyId: full.historyId,
      internalDate: full.internalDate
        ? new Date(Number(full.internalDate)).toISOString()
        : undefined,
      sizeEstimate: full.sizeEstimate,
      subject: parsed.subject,
      body: parsed.body,
      from: parsed.from,
      to: parsed.to,
      payload: full.payload,
    };
    const entity = await messagesDb.upsertByEntityId(data.id, data);
    await emailService.embedMessage(userId, entity.id, data);

    return toEmailDetail(data);
  },

  /** Sends an existing Gmail draft as-is, removes it from the Drafts folder, and drops it from the local drafts cache. */
  async sendDraft(userId: number, draftId: string): Promise<{ id?: string; threadId?: string }> {
    const draftsApi = getDraftsApi(userId);
    const sent = await draftsApi.send({ id: draftId });
    await getDraftsDb(userId).deleteByEntityId(draftId);
    return { id: sent.id, threadId: sent.threadId };
  },

  /** Discards a saved Gmail draft and drops it from the local drafts cache. */
  async deleteDraft(userId: number, draftId: string): Promise<void> {
    const draftsApi = getDraftsApi(userId);
    await draftsApi.delete({ id: draftId });
    await getDraftsDb(userId).deleteByEntityId(draftId);
  },

  /**
   * Sends an email immediately via Gmail. When `replyToEmailId` is given,
   * the message is threaded onto that email: `to`/`subject` default to the
   * original sender/"Re: <subject>", and `In-Reply-To`/`References` headers
   * are set so Gmail groups it with the original conversation.
   */
  async sendEmail(
    userId: number,
    options: {
      to?: string;
      cc?: string;
      bcc?: string;
      subject?: string;
      body: string;
      replyToEmailId?: string;
      attachments?: EmailAttachment[];
      /** Per-file size cap for the sender's plan; required when attachments are present. */
      maxBytesPerFile?: number;
    },
  ): Promise<{ id?: string; to: string; subject: string; threadId?: string }> {
    let to = options.to?.trim();
    let subject = options.subject?.trim();
    let threadId: string | undefined;
    let inReplyTo: string | undefined;

    const messagesApi = getMessagesApi(userId);

    if (options.replyToEmailId) {
      const original = await messagesApi.get({ id: options.replyToEmailId, format: "full" });
      const parsed = parseEmailContent(original.payload);

      to = to || parsed.from;
      const originalSubject = parsed.subject ?? "";
      subject =
        subject || (/^re:/i.test(originalSubject) ? originalSubject : `Re: ${originalSubject}`);
      threadId = original.threadId;
      inReplyTo = findHeader(original.payload?.headers, "Message-ID");
    }

    if (!to) {
      throw new Error("No recipient address - provide `to` or `replyToEmailId`.");
    }

    // The AI writes the body in markdown (e.g. `**bold**`, lists, links). Send it as
    // multipart/alternative so HTML-capable clients render it formatted while
    // plain-text clients fall back to the original markdown source.
    const html = markdownToHtml(options.body);
    const altBoundary = `alt_${crypto.randomBytes(12).toString("hex")}`;

    // The alternative block (plain + html), without a leading Content-Type header —
    // that header is supplied either at the top level (no attachments) or by the
    // enclosing mixed part (with attachments).
    const altInner = [
      `--${altBoundary}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      ``,
      options.body,
      ``,
      `--${altBoundary}`,
      `Content-Type: text/html; charset="UTF-8"`,
      ``,
      html,
      ``,
      `--${altBoundary}--`,
    ].join("\r\n");

    const headerLines = [`To: ${to}`, `Subject: ${subject ?? ""}`, `MIME-Version: 1.0`];
    if (options.cc?.trim()) headerLines.push(`Cc: ${options.cc.trim()}`);
    if (options.bcc?.trim()) headerLines.push(`Bcc: ${options.bcc.trim()}`);
    if (inReplyTo) {
      headerLines.push(`In-Reply-To: ${inReplyTo}`, `References: ${inReplyTo}`);
    }

    const attachments = options.attachments ?? [];
    let messageBody: string;

    if (attachments.length > 0) {
      assertAttachmentsWithinLimits(
        attachments,
        options.maxBytesPerFile ?? MAX_TOTAL_ATTACHMENT_BYTES,
      );

      // Wrap the alternative block plus each attachment in a multipart/mixed envelope.
      const mixedBoundary = `mixed_${crypto.randomBytes(12).toString("hex")}`;
      headerLines.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`);

      const parts = [
        `--${mixedBoundary}`,
        `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
        ``,
        altInner,
      ];
      for (const att of attachments) {
        const name = sanitizeHeaderParam(att.filename) || "attachment";
        const type = sanitizeHeaderParam(att.mimeType) || "application/octet-stream";
        parts.push(
          `--${mixedBoundary}`,
          `Content-Type: ${type}; name="${name}"`,
          `Content-Transfer-Encoding: base64`,
          `Content-Disposition: attachment; filename="${name}"`,
          ``,
          wrapBase64(att.data),
        );
      }
      parts.push(`--${mixedBoundary}--`);
      messageBody = parts.join("\r\n");
    } else {
      headerLines.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
      messageBody = altInner;
    }

    const raw = Buffer.from(`${headerLines.join("\r\n")}\r\n\r\n${messageBody}`).toString(
      "base64url",
    );

    const sent = await messagesApi.send({ raw, threadId });

    return { id: sent.id, to, subject: subject ?? "", threadId: sent.threadId ?? threadId };
  },
};
