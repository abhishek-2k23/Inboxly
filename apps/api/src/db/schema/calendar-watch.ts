import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";

// Tracks the Google Calendar push notification "channel" registered for each
// connected account (`events.watch`) so the webhook can map an incoming
// `X-Goog-Channel-Id` back to a local user, and so a renewal job can
// re-register before the channel's expiration.
export const calendarWatchState = pgTable("calendar_watch_state", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  calendarId: text("calendar_id").notNull().default("primary"),
  channelId: text("channel_id").notNull().unique(),
  resourceId: text("resource_id").notNull(),
  expiration: timestamp("expiration", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CalendarWatchState = typeof calendarWatchState.$inferSelect;
export type NewCalendarWatchState = typeof calendarWatchState.$inferInsert;
