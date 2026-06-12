import { integer, jsonb, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const connectionStatusEnum = pgEnum("connection_status", ["active", "revoked", "error"]);

// A user's connected Google account (Gmail + Calendar), brokered via Corsair.
// One connection per user (single Google account per user).
export const integrationConnections = pgTable("integration_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("google"),
  corsairConnectionId: text("corsair_connection_id").notNull().unique(),
  accountEmail: text("account_email").notNull(),
  status: connectionStatusEnum("status").notNull().default("active"),
  scopes: jsonb("scopes").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type IntegrationConnection = typeof integrationConnections.$inferSelect;
export type NewIntegrationConnection = typeof integrationConnections.$inferInsert;
