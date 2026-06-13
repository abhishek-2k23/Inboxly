import { index, integer, pgTable, serial, text, timestamp, vector } from "drizzle-orm/pg-core";
import { users } from "./users.js";

// AI enrichment for a Google Calendar event synced into Corsair's
// `corsair_entities` table (entity_type "googlecalendar.events"). `entityId`
// references `corsair_entities.id` (text, managed by Corsair's own migration)
// — not a DB-level FK, since that table lives outside Drizzle's schema.
// `embedding` + `contentHash` back local semantic search (vector(1536) =
// OpenAI text-embedding-3-small) with an HNSW index.
export const calendarAiMeta = pgTable(
  "calendar_ai_meta",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entityId: text("entity_id").notNull().unique(),
    embedding: vector("embedding", { dimensions: 1536 }),
    contentHash: text("content_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_calendar_ai_meta_embedding").using("hnsw", table.embedding.op("vector_cosine_ops"))],
);

export type CalendarAiMeta = typeof calendarAiMeta.$inferSelect;
export type NewCalendarAiMeta = typeof calendarAiMeta.$inferInsert;
