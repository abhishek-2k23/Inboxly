import { integer, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const subscriptionTypeEnum = pgEnum("subscription_type", ["free", "pro"]);

export type SubscriptionType = (typeof subscriptionTypeEnum.enumValues)[number];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),

  // Billing / subscription.
  subscriptionType: subscriptionTypeEnum("subscription_type").notNull().default("free"),
  subscriptionUpdatedAt: timestamp("subscription_updated_at", { withTimezone: true }),
  paymentBrand: text("payment_brand"),
  paymentLast4: text("payment_last4"),

  // Usage meters (enforced against the plan's limits).
  chatsUsed: integer("chats_used").notNull().default(0),
  conversationsUsed: integer("conversations_used").notNull().default(0),
  emailSyncsUsed: integer("email_syncs_used").notNull().default(0),

  // Last time this user made an authenticated request. Drives which
  // accounts the Gmail/Calendar watch sweeps bother to (re)register for -
  // see lastActive in user.model.ts.
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
