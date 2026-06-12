import { desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { items } from "../db/schema/index.js";

export interface ItemRecord {
  id: number;
  name: string;
  userId: number;
  createdAt: string;
}

function mapRow(row: typeof items.$inferSelect): ItemRecord {
  return {
    id: row.id,
    name: row.name,
    userId: row.userId,
    createdAt: row.createdAt.toISOString(),
  };
}

export const itemModel = {
  async findAllByUser(userId: number): Promise<ItemRecord[]> {
    const rows = await db.select().from(items).where(eq(items.userId, userId)).orderBy(desc(items.id));
    return rows.map(mapRow);
  },

  async create(userId: number, name: string): Promise<ItemRecord> {
    const [row] = await db.insert(items).values({ userId, name }).returning();
    return mapRow(row!);
  },
};
