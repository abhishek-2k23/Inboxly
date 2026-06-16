import { and, eq, lt, or, isNull, sql } from "drizzle-orm";
import type { SubscriptionType, UsageSummary } from "@repo/shared";
import { db } from "../db/client.js";
import { users } from "../db/schema/index.js";

/** Only bump `last_active_at` this often - avoids a write on every single request. */
const ACTIVITY_TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export interface UserRecord {
  id: number;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  subscriptionType: SubscriptionType;
  subscriptionUpdatedAt: string | null;
  paymentBrand: string | null;
  paymentLast4: string | null;
  chatsUsed: number;
  conversationsUsed: number;
  emailSyncsUsed: number;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertUserInput {
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

function mapRow(row: typeof users.$inferSelect): UserRecord {
  return {
    id: row.id,
    clerkId: row.clerkId,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    imageUrl: row.imageUrl,
    subscriptionType: row.subscriptionType,
    subscriptionUpdatedAt: row.subscriptionUpdatedAt?.toISOString() ?? null,
    paymentBrand: row.paymentBrand,
    paymentLast4: row.paymentLast4,
    chatsUsed: row.chatsUsed,
    conversationsUsed: row.conversationsUsed,
    emailSyncsUsed: row.emailSyncsUsed,
    lastActiveAt: row.lastActiveAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const userModel = {
  async findByClerkId(clerkId: string): Promise<UserRecord | null> {
    const [row] = await db.select().from(users).where(eq(users.clerkId, clerkId));
    return row ? mapRow(row) : null;
  },

  async upsert(input: UpsertUserInput): Promise<UserRecord> {
    const [row] = await db
      .insert(users)
      .values(input)
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          imageUrl: input.imageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return mapRow(row!);
  },

  /** Atomically bumps one usage meter and returns the updated user. */
  async incrementUsage(userId: number, metric: keyof UsageSummary): Promise<UserRecord> {
    const set =
      metric === "chats"
        ? { chatsUsed: sql`${users.chatsUsed} + 1` }
        : metric === "conversations"
          ? { conversationsUsed: sql`${users.conversationsUsed} + 1` }
          : { emailSyncsUsed: sql`${users.emailSyncsUsed} + 1` };
    const [row] = await db
      .update(users)
      .set({ ...set, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return mapRow(row!);
  },

  async setSubscription(
    userId: number,
    input: { type: SubscriptionType; paymentBrand: string | null; paymentLast4: string | null },
  ): Promise<UserRecord> {
    const [row] = await db
      .update(users)
      .set({
        subscriptionType: input.type,
        paymentBrand: input.paymentBrand,
        paymentLast4: input.paymentLast4,
        subscriptionUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return mapRow(row!);
  },

  async deleteByClerkId(clerkId: string): Promise<void> {
    await db.delete(users).where(eq(users.clerkId, clerkId));
  },

  /**
   * Marks the user as active right now, but only writes when the existing
   * timestamp is stale (or unset) - called on every authenticated request,
   * so this keeps it to one write per user per ACTIVITY_TOUCH_INTERVAL_MS
   * instead of one per request. Used to scope the Gmail/Calendar watch
   * sweeps to users who are actually using the app (see gmail-watch.service
   * / calendar-watch.service), instead of every account that ever connected.
   */
  async touchLastActive(userId: number): Promise<void> {
    const staleBefore = new Date(Date.now() - ACTIVITY_TOUCH_INTERVAL_MS);
    await db
      .update(users)
      .set({ lastActiveAt: new Date() })
      .where(
        and(
          eq(users.id, userId),
          or(isNull(users.lastActiveAt), lt(users.lastActiveAt, staleBefore)),
        ),
      );
  },
};
