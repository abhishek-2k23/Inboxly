import * as SQLite from "expo-sqlite";

/**
 * Synchronous SQLite key-value store used for two purposes:
 *  1. Clerk token cache — keeps the user signed in across app restarts.
 *  2. Zustand persist adapter — durable storage for auth-store state.
 *
 * Uses WAL mode for better read/write concurrency on device.
 */
const db = SQLite.openDatabaseSync("inboxly.db");

db.execSync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS kv_store (
    key        TEXT PRIMARY KEY NOT NULL,
    value      TEXT NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch())
  );
`);

export const sqliteStorage = {
  getItem(key: string): string | null {
    const row = db.getFirstSync<{ value: string }>("SELECT value FROM kv_store WHERE key = ?", [
      key,
    ]);
    return row?.value ?? null;
  },

  setItem(key: string, value: string): void {
    db.runSync(
      "INSERT OR REPLACE INTO kv_store (key, value, updated_at) VALUES (?, ?, unixepoch())",
      [key, value],
    );
  },

  removeItem(key: string): void {
    db.runSync("DELETE FROM kv_store WHERE key = ?", [key]);
  },
};

/**
 * Async wrapper satisfying @clerk/clerk-expo's TokenCache interface.
 * Clerk calls these on every session refresh — keeping them on SQLite
 * avoids the cleartext-AsyncStorage footprint.
 */
export const clerkTokenCache = {
  async getToken(key: string): Promise<string | null> {
    return sqliteStorage.getItem(key);
  },
  async saveToken(key: string, token: string): Promise<void> {
    sqliteStorage.setItem(key, token);
  },
  async clearToken(key: string): Promise<void> {
    sqliteStorage.removeItem(key);
  },
};

/** Zustand StateStorage adapter (sync — Zustand v5 supports both). */
export const zustandSQLiteStorage = {
  getItem: (name: string) => sqliteStorage.getItem(name),
  setItem: (name: string, value: string) => sqliteStorage.setItem(name, value),
  removeItem: (name: string) => sqliteStorage.removeItem(name),
};
