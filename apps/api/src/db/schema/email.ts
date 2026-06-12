import { index, integer, pgEnum, pgTable, serial, text, timestamp, vector } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const emailPriorityEnum = pgEnum("email_priority", ["high", "medium", "low"]);

// AI enrichment for a Gmail message synced into Corsair's `corsair_entities`
// table (entity_type "gmail.message"). `entityId` references `corsair_entities.id`
// (text, managed by Corsair's own migration) — not a DB-level FK, since that table
// lives outside Drizzle's schema.
// `priority`/`priorityReason` hold the cheap-LLM triage result; `embedding` +
// `contentHash` back local semantic search (vector(1536) = OpenAI
// text-embedding-3-small) with an HNSW index.
export const emailAiMeta = pgTable(
  "email_ai_meta",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entityId: text("entity_id").notNull().unique(),
    priority: emailPriorityEnum("priority"),
    priorityReason: text("priority_reason"),
    embedding: vector("embedding", { dimensions: 1536 }),
    contentHash: text("content_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_email_ai_meta_user_priority").on(table.userId, table.priority),
    index("idx_email_ai_meta_embedding").using("hnsw", table.embedding.op("vector_cosine_ops")),
  ],
);

export type EmailAiMeta = typeof emailAiMeta.$inferSelect;
export type NewEmailAiMeta = typeof emailAiMeta.$inferInsert;
