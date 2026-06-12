import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const calendarEventStatusEnum = pgEnum("calendar_event_status", [
  "confirmed",
  "tentative",
  "cancelled",
]);

// Google Calendars the user has access to.
export const calendars = pgTable(
  "calendars",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    googleCalendarId: text("google_calendar_id").notNull(),
    name: text("name").notNull(),
    color: text("color"),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("calendars_user_calendar_unique").on(table.userId, table.googleCalendarId)],
);

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    calendarId: integer("calendar_id")
      .notNull()
      .references(() => calendars.id, { onDelete: "cascade" }),
    googleEventId: text("google_event_id").notNull(),
    title: text("title"),
    description: text("description"),
    location: text("location"),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    timezone: text("timezone"),
    isAllDay: boolean("is_all_day").notNull().default(false),
    status: calendarEventStatusEnum("status").notNull().default("confirmed"),
    organizerEmail: text("organizer_email"),
    attendees: jsonb("attendees").notNull().default([]),
    meetingLink: text("meeting_link"),
    recurrenceRule: text("recurrence_rule"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("calendar_events_calendar_event_unique").on(table.calendarId, table.googleEventId),
    index("idx_calendar_events_user_start").on(table.userId, table.startTime),
  ],
);

export type Calendar = typeof calendars.$inferSelect;
export type NewCalendar = typeof calendars.$inferInsert;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;
