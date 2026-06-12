import { index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const webhookEventStatusEnum = pgEnum("webhook_event_status", [
  "pending",
  "processed",
  "failed",
]);

// Raw Corsair webhook deliveries (Gmail/Calendar push notifications), processed async.
export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    corsairEventId: text("corsair_event_id").notNull(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    status: webhookEventStatusEnum("status").notNull().default("pending"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("webhook_events_provider_event_unique").on(table.provider, table.corsairEventId),
    index("idx_webhook_events_status").on(table.status, table.createdAt),
  ],
);

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
