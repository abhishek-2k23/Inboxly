import { pool } from "../db/pool.js";

export interface ItemRecord {
  id: number;
  name: string;
  userId: number;
  createdAt: string;
}

interface ItemRow {
  id: number;
  name: string;
  user_id: number;
  created_at: string;
}

function mapRow(row: ItemRow): ItemRecord {
  return {
    id: row.id,
    name: row.name,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

export const itemModel = {
  async findAllByUser(userId: number): Promise<ItemRecord[]> {
    const result = await pool.query<ItemRow>(
      "SELECT id, name, user_id, created_at FROM items WHERE user_id = $1 ORDER BY id DESC",
      [userId],
    );
    return result.rows.map(mapRow);
  },

  async create(userId: number, name: string): Promise<ItemRecord> {
    const result = await pool.query<ItemRow>(
      "INSERT INTO items (name, user_id) VALUES ($1, $2) RETURNING id, name, user_id, created_at",
      [userId, name],
    );
    return mapRow(result.rows[0] as ItemRow);
  },
};
