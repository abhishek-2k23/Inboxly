import crypto from "node:crypto";
import { GmailSchema } from "@corsair-dev/gmail";
import type { GmailEndpointInputs, GmailEndpointOutputs } from "@corsair-dev/gmail";
import type { EmailSearchResult, EmailSummary } from "@repo/shared";
import type { PluginEntityClient } from "corsair/orm";
import { sql } from "drizzle-orm";
import type { z } from "zod";
import { db } from "../db/client.js";
import { corsair, toTenantId } from "../lib/corsair.js";
import { parseEmailContent } from "../lib/gmail-message.js";
import { openai } from "../lib/openai.js";
import { emailAiMetaModel } from "../models/email.model.js";

export type GmailMessageData = z.infer<typeof GmailSchema.entities.messages>;

/**
 * The corsair tenant client's plugin namespaces (`client.gmail.api`/`.db`) are
 * inferred as `any` by the SDK for this plugin combination, so we cast the two
 * surfaces we use to their documented shapes at this single boundary.
 */
type GmailMessagesApi = {
  list: (args: GmailEndpointInputs["messagesList"]) => Promise<GmailEndpointOutputs["messagesList"]>;
  get: (args: GmailEndpointInputs["messagesGet"]) => Promise<GmailEndpointOutputs["messagesGet"]>;
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
    internalDate: data.internalDate ?? null,
  };
}

function buildContentHash(subject: string, body: string): string {
  return crypto.createHash("sha256").update(`${subject}\n${body}`).digest("hex");
}

export const emailService = {
  async syncInbox(userId: number, maxResults = DEFAULT_SYNC_LIMIT): Promise<{ synced: number; embedded: number }> {
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
          internalDate: full.internalDate ? new Date(Number(full.internalDate)).toISOString() : undefined,
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

    console.log(`[email-sync] syncInbox done for user ${userId}: synced=${synced}, embedded=${embedded}`);
    return { synced, embedded };
  },

  async embedMessage(userId: number, entityRowId: string, data: GmailMessageData): Promise<boolean> {
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

  async listInbox(userId: number, options: { limit?: number; offset?: number } = {}): Promise<EmailSummary[]> {
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
      ORDER BY (ce.data->>'internalDate')::timestamptz DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `);

    return result.rows.map((row) => toEmailSummary(row.data));
  },

  async searchInbox(userId: number, query: string, limit = DEFAULT_SEARCH_LIMIT): Promise<EmailSearchResult[]> {
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
};
