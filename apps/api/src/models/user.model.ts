import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema/index.js";

export interface UserRecord {
  id: number;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
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

  async deleteByClerkId(clerkId: string): Promise<void> {
    await db.delete(users).where(eq(users.clerkId, clerkId));
  },
};
