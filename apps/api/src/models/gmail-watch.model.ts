import { eq, lt, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { gmailWatchState } from "../db/schema/index.js";

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

  async findExpiringBefore(date: Date): Promise<{ userId: number }[]> {
    return db
      .select({ userId: gmailWatchState.userId })
      .from(gmailWatchState)
      .where(lt(gmailWatchState.expiration, date));
  },

  /**
   * Finds users who have a connected Gmail account (via Corsair) but no
   * `gmail_watch_state` row yet - i.e. accounts connected before push
   * notifications were wired up, which never called `users.watch`.
   */
  async findConnectedUserIdsWithoutWatch(): Promise<number[]> {
    const result = await db.execute<{ user_id: number }>(sql`
      SELECT DISTINCT (regexp_match(ca.tenant_id, '^user_(\\d+)$'))[1]::int AS user_id
      FROM corsair_accounts ca
      JOIN corsair_integrations ci ON ci.id = ca.integration_id
      WHERE ci.name = 'gmail'
        AND ca.dek IS NOT NULL
        AND ca.tenant_id ~ '^user_\\d+$'
        AND NOT EXISTS (
          SELECT 1 FROM gmail_watch_state gws WHERE gws.user_id = (regexp_match(ca.tenant_id, '^user_(\\d+)$'))[1]::int
        )
    `);
    return result.rows.map((row) => row.user_id);
  },
};
