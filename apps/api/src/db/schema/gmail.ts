import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";

// Tracks the Gmail `users.watch` registration for each connected account so
// the webhook can map an incoming Pub/Sub `emailAddress` back to a local user
// and so a renewal job can re-register before Google's 7-day expiry.
export const gmailWatchState = pgTable("gmail_watch_state", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  emailAddress: text("email_address").notNull().unique(),
  historyId: text("history_id"),
  expiration: timestamp("expiration", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type GmailWatchState = typeof gmailWatchState.$inferSelect;
export type NewGmailWatchState = typeof gmailWatchState.$inferInsert;
