import { and, cosineDistance, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { emailAiMeta } from "../db/schema/index.js";

export interface EmailEmbeddingMeta {
  contentHash: string | null;
}

export interface EmailSearchMatch {
  entityId: string;
  similarity: number;
}

export const emailAiMetaModel = {
  async findByEntityId(userId: number, entityId: string): Promise<EmailEmbeddingMeta | null> {
    const [row] = await db
      .select({ contentHash: emailAiMeta.contentHash })
      .from(emailAiMeta)
      .where(and(eq(emailAiMeta.userId, userId), eq(emailAiMeta.entityId, entityId)));
    return row ?? null;
  },

  async upsertEmbedding(userId: number, entityId: string, embedding: number[], contentHash: string): Promise<void> {
    await db
      .insert(emailAiMeta)
      .values({ userId, entityId, embedding, contentHash })
      .onConflictDoUpdate({
        target: emailAiMeta.entityId,
        set: { embedding, contentHash, updatedAt: new Date() },
      });
  },

  async searchByEmbedding(userId: number, embedding: number[], limit: number): Promise<EmailSearchMatch[]> {
    const distance = cosineDistance(emailAiMeta.embedding, embedding);
    const rows = await db
      .select({
        entityId: emailAiMeta.entityId,
        similarity: sql<number>`1 - (${distance})`,
      })
      .from(emailAiMeta)
      .where(and(eq(emailAiMeta.userId, userId), isNotNull(emailAiMeta.embedding)))
      .orderBy(distance)
      .limit(limit);

    return rows.map((row) => ({ entityId: row.entityId, similarity: Number(row.similarity) }));
  },
};
