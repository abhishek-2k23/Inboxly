import { and, cosineDistance, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { calendarAiMeta } from "../db/schema/index.js";

export interface CalendarEventEmbeddingMeta {
  contentHash: string | null;
}

export interface CalendarEventSearchMatch {
  entityId: string;
  similarity: number;
}

export const calendarAiMetaModel = {
  async findByEntityId(
    userId: number,
    entityId: string,
  ): Promise<CalendarEventEmbeddingMeta | null> {
    const [row] = await db
      .select({ contentHash: calendarAiMeta.contentHash })
      .from(calendarAiMeta)
      .where(and(eq(calendarAiMeta.userId, userId), eq(calendarAiMeta.entityId, entityId)));
    return row ?? null;
  },

  async upsertEmbedding(
    userId: number,
    entityId: string,
    embedding: number[],
    contentHash: string,
  ): Promise<void> {
    await db
      .insert(calendarAiMeta)
      .values({ userId, entityId, embedding, contentHash })
      .onConflictDoUpdate({
        target: calendarAiMeta.entityId,
        set: { embedding, contentHash, updatedAt: new Date() },
      });
  },

  async deleteByEntityId(userId: number, entityId: string): Promise<void> {
    await db
      .delete(calendarAiMeta)
      .where(and(eq(calendarAiMeta.userId, userId), eq(calendarAiMeta.entityId, entityId)));
  },

  async searchByEmbedding(
    userId: number,
    embedding: number[],
    limit: number,
  ): Promise<CalendarEventSearchMatch[]> {
    const distance = cosineDistance(calendarAiMeta.embedding, embedding);
    const rows = await db
      .select({
        entityId: calendarAiMeta.entityId,
        similarity: sql<number>`1 - (${distance})`,
      })
      .from(calendarAiMeta)
      .where(and(eq(calendarAiMeta.userId, userId), isNotNull(calendarAiMeta.embedding)))
      .orderBy(distance)
      .limit(limit);

    return rows.map((row) => ({ entityId: row.entityId, similarity: Number(row.similarity) }));
  },
};
