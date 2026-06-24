import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { gmailWatchState, users } from "../db/schema/index.js";

/**
 * Watch sweeps only bother (re)registering for accounts that have used the
 * app within this window - skips Google API calls (and the resulting
 * webhook/push traffic) for connected-but-abandoned accounts, which is what
 * was burning through rate limits.
 */
const ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export interface GmailWatchUpsertInput {
  userId: number;
  emailAddress: string;
  historyId: string;
  expiration: Date;
}

export const gmailWatchModel = {
  async upsert(input: GmailWatchUpsertInput): Promise<void> {
    await db
      .insert(gmailWatchState)
      .values(input)
      .onConflictDoUpdate({
        target: gmailWatchState.userId,
        set: {
          emailAddress: input.emailAddress,
          historyId: input.historyId,
          expiration: input.expiration,
          updatedAt: new Date(),
        },
      });
  },

  async findUserIdByEmail(emailAddress: string): Promise<number | null> {
    const [row] = await db
      .select({ userId: gmailWatchState.userId })
      .from(gmailWatchState)
      .where(eq(gmailWatchState.emailAddress, emailAddress));
    return row?.userId ?? null;
  },

  /** Only watches belonging to users active within ACTIVE_WINDOW_MS are renewed - see ACTIVE_WINDOW_MS. */
  async findExpiringBefore(date: Date): Promise<{ userId: number }[]> {
    return db
      .select({ userId: gmailWatchState.userId })
      .from(gmailWatchState)
      .innerJoin(users, eq(users.id, gmailWatchState.userId))
      .where(
        and(
          lt(gmailWatchState.expiration, date),
          gte(users.lastActiveAt, new Date(Date.now() - ACTIVE_WINDOW_MS)),
        ),
      );
  },

  /**
   * Finds recently-active users who have a connected Gmail account (via
   * Corsair) but no `gmail_watch_state` row yet - i.e. accounts connected
   * before push notifications were wired up, which never called
   * `users.watch`. Scoped to ACTIVE_WINDOW_MS so this doesn't register
   * (and start receiving push traffic for) accounts nobody is using.
   */
  async deleteByUserId(userId: number): Promise<void> {
    await db.delete(gmailWatchState).where(eq(gmailWatchState.userId, userId));
  },

  async findConnectedUserIdsWithoutWatch(): Promise<number[]> {
    const result = await db.execute<{ user_id: number }>(sql`
      SELECT DISTINCT u.id AS user_id
      FROM corsair_accounts ca
      JOIN corsair_integrations ci ON ci.id = ca.integration_id
      JOIN users u ON u.id = (regexp_match(ca.tenant_id, '^user_(\\d+)$'))[1]::int
      WHERE ci.name = 'gmail'
        AND ca.dek IS NOT NULL
        AND ca.tenant_id ~ '^user_\\d+$'
        AND u.last_active_at > now() - interval '30 days'
        AND NOT EXISTS (
          SELECT 1 FROM gmail_watch_state gws WHERE gws.user_id = u.id
        )
    `);
    return result.rows.map((row) => row.user_id);
  },
};
