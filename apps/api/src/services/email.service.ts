import crypto from "node:crypto";
import { GmailSchema } from "@corsair-dev/gmail";
import type { GmailEndpointInputs, GmailEndpointOutputs } from "@corsair-dev/gmail";
import type { EmailSearchResult, EmailSummary } from "@repo/shared";
import type { PluginEntityClient } from "corsair/orm";
import { sql } from "drizzle-orm";
import type { z } from "zod";
import { db } from "../db/client.js";
import { corsair, toTenantId } from "../lib/corsair.js";
import { findHeader, parseEmailContent } from "../lib/gmail-message.js";
import { markdownToHtml } from "../lib/markdown.js";
import { openai } from "../lib/openai.js";
import { emailAiMetaModel } from "../models/email.model.js";

export type GmailMessageData = z.infer<typeof GmailSchema.entities.messages>;

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
};

type GmailMessagesDb = PluginEntityClient<typeof GmailSchema.entities.messages>;

function getMessagesApi(userId: number): GmailMessagesApi {
  return corsair.withTenant(toTenantId(userId)).gmail.api.messages as GmailMessagesApi;
}

function getMessagesDb(userId: number): GmailMessagesDb {
  return corsair.withTenant(toTenantId(userId)).gmail.db.messages as GmailMessagesDb;
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

function buildContentHash(subject: string, body: string): string {
  return crypto.createHash("sha256").update(`${subject}\n${body}`).digest("hex");
}

export const emailService = {
  async syncInbox(
    userId: number,
    maxResults = DEFAULT_SYNC_LIMIT,
  ): Promise<{ synced: number; embedded: number }> {
    console.log(`[email-sync] syncInbox start for user ${userId} (maxResults=${maxResults})`);

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
        // Only sync the actual inbox - Gmail's default `messages.list` also
        // returns SENT/DRAFT/SPAM/TRASH/CHAT, which surface as "Unknown"
        // sender / empty-body rows that aren't in the Gmail inbox.
        labelIds: ["INBOX"],
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
        };

        const entity = await messagesDb.upsertByEntityId(data.id, data);
        synced += 1;

        const wasEmbedded = await emailService.embedMessage(userId, entity.id, data);
        if (wasEmbedded) embedded += 1;
      }

      pageToken = nextPageToken;
    } while (pageToken && synced < total);

    console.log(
      `[email-sync] syncInbox done for user ${userId}: synced=${synced}, embedded=${embedded}`,
    );
    return { synced, embedded };
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
      ORDER BY (
        -- Use POSIX bracket classes, not \d: Postgres' regex strips the
        -- backslash escape here, so '\d' matched a literal "d" and every row
        -- fell through to NULL, leaving the inbox effectively unsorted.
        CASE
          WHEN ce.data->>'internalDate' ~ '^[0-9]+$'
            THEN to_timestamp((ce.data->>'internalDate')::bigint / 1000.0)
          WHEN ce.data->>'internalDate' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
            THEN (ce.data->>'internalDate')::timestamptz
          ELSE NULL
        END
      ) DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `);

    return result.rows.map((row) => toEmailSummary(row.data));
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
   * Fetches the most recent messages directly from Gmail (not the local sync
   * cache), so "latest email" requests reflect mail that arrived after the
   * last sync/webhook update.
   */
  async listRecentFromInbox(userId: number, limit = DEFAULT_LIST_LIMIT): Promise<EmailSummary[]> {
    const messagesApi = getMessagesApi(userId);
    const { messages } = await messagesApi.list({ maxResults: limit, labelIds: ["INBOX"] });

    const results: EmailSummary[] = [];
    for (const stub of messages ?? []) {
      if (!stub.id) continue;
      const email = await emailService.getEmailById(userId, stub.id);
      if (email) results.push(email);
    }
    return results;
  },

  async getEmailById(userId: number, id: string): Promise<EmailSummary | null> {
    const messagesApi = getMessagesApi(userId);
    const full = await messagesApi.get({ id, format: "full" });
    if (!full.id) return null;

    const parsed = parseEmailContent(full.payload);
    return {
      id: full.id,
      threadId: full.threadId,
      subject: parsed.subject,
      from: parsed.from,
      to: parsed.to,
      snippet: full.snippet,
      body: parsed.body,
      bodyHtml: parsed.html,
      labelIds: full.labelIds,
      internalDate: full.internalDate ? new Date(Number(full.internalDate)).toISOString() : null,
    };
  },

  /**
   * Sends an email immediately via Gmail. When `replyToEmailId` is given,
   * the message is threaded onto that email: `to`/`subject` default to the
   * original sender/"Re: <subject>", and `In-Reply-To`/`References` headers
   * are set so Gmail groups it with the original conversation.
   */
  async sendEmail(
    userId: number,
    options: { to?: string; subject?: string; body: string; replyToEmailId?: string },
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
    const boundary = `boundary_${crypto.randomBytes(16).toString("hex")}`;
    const html = markdownToHtml(options.body);

    const headerLines = [
      `To: ${to}`,
      `Subject: ${subject ?? ""}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ];
    if (inReplyTo) {
      headerLines.push(`In-Reply-To: ${inReplyTo}`, `References: ${inReplyTo}`);
    }

    const messageBody = [
      `--${boundary}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      ``,
      options.body,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset="UTF-8"`,
      ``,
      html,
      ``,
      `--${boundary}--`,
    ].join("\r\n");

    const raw = Buffer.from(`${headerLines.join("\r\n")}\r\n\r\n${messageBody}`).toString(
      "base64url",
    );

    const sent = await messagesApi.send({ raw, threadId });

    return { id: sent.id, to, subject: subject ?? "", threadId: sent.threadId ?? threadId };
  },
};
