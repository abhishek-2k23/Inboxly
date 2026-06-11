import { pool } from "../db/pool.js";

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

interface UserRow {
  id: number;
  clerk_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: UserRow): UserRecord {
  return {
    id: row.id,
    clerkId: row.clerk_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const userModel = {
  async findByClerkId(clerkId: string): Promise<UserRecord | null> {
    const result = await pool.query<UserRow>("SELECT * FROM users WHERE clerk_id = $1", [clerkId]);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async upsert(input: UpsertUserInput): Promise<UserRecord> {
    const result = await pool.query<UserRow>(
      `INSERT INTO users (clerk_id, email, first_name, last_name, image_url)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (clerk_id) DO UPDATE
         SET email = EXCLUDED.email,
             first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name,
             image_url = EXCLUDED.image_url,
             updated_at = now()
       RETURNING *`,
      [input.clerkId, input.email, input.firstName, input.lastName, input.imageUrl],
    );
    return mapRow(result.rows[0] as UserRow);
  },

  async deleteByClerkId(clerkId: string): Promise<void> {
    await pool.query("DELETE FROM users WHERE clerk_id = $1", [clerkId]);
  },
};
