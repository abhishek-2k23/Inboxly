import { eq, sql } from "drizzle-orm";
import type { SubscriptionType, UsageSummary } from "@repo/shared";
import { db } from "../db/client.js";
import { users } from "../db/schema/index.js";

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
};
