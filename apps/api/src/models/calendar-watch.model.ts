import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { calendarWatchState, users } from "../db/schema/index.js";

/**
 * Watch sweeps only bother (re)registering for accounts that have used the
 * app within this window - skips Google API calls (and the resulting
 * webhook/push traffic) for connected-but-abandoned accounts, which is what
 * was burning through rate limits.
 */
const ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export interface CalendarWatchUpsertInput {
  userId: number;
  calendarId: string;
  channelId: string;
  resourceId: string;
  expiration: Date;
}

export const calendarWatchModel = {
  async upsert(input: CalendarWatchUpsertInput): Promise<void> {
    await db
      .insert(calendarWatchState)
      .values(input)
      .onConflictDoUpdate({
        target: calendarWatchState.userId,
        set: {
          calendarId: input.calendarId,
          channelId: input.channelId,
          resourceId: input.resourceId,
          expiration: input.expiration,
          updatedAt: new Date(),
        },
      });
  },

  async findByChannelId(channelId: string): Promise<{ userId: number; resourceId: string } | null> {
    const [row] = await db
      .select({ userId: calendarWatchState.userId, resourceId: calendarWatchState.resourceId })
      .from(calendarWatchState)
      .where(eq(calendarWatchState.channelId, channelId));
    return row ?? null;
  },

  /** Only watches belonging to users active within ACTIVE_WINDOW_MS are renewed - see ACTIVE_WINDOW_MS. */
  async findExpiringBefore(date: Date): Promise<{ userId: number }[]> {
    return db
      .select({ userId: calendarWatchState.userId })
      .from(calendarWatchState)
      .innerJoin(users, eq(users.id, calendarWatchState.userId))
      .where(
        and(
          lt(calendarWatchState.expiration, date),
          gte(users.lastActiveAt, new Date(Date.now() - ACTIVE_WINDOW_MS)),
        ),
      );
  },

  /**
   * Finds recently-active users who have a connected Google Calendar
   * account (via Corsair) but no `calendar_watch_state` row yet - i.e.
   * accounts connected before push notifications were wired up, which never
   * called `events.watch`. Scoped to ACTIVE_WINDOW_MS so this doesn't
   * register (and start receiving push traffic for) accounts nobody is using.
   */
  async findConnectedUserIdsWithoutWatch(): Promise<number[]> {
    const result = await db.execute<{ user_id: number }>(sql`
      SELECT DISTINCT u.id AS user_id
      FROM corsair_accounts ca
      JOIN corsair_integrations ci ON ci.id = ca.integration_id
      JOIN users u ON u.id = (regexp_match(ca.tenant_id, '^user_(\\d+)$'))[1]::int
      WHERE ci.name = 'googlecalendar'
        AND ca.dek IS NOT NULL
        AND ca.tenant_id ~ '^user_\\d+$'
        AND u.last_active_at > now() - interval '30 days'
        AND NOT EXISTS (
          SELECT 1 FROM calendar_watch_state cws WHERE cws.user_id = u.id
        )
    `);
    return result.rows.map((row) => row.user_id);
  },
};
