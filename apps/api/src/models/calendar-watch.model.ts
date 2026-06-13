import { eq, lt, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { calendarWatchState } from "../db/schema/index.js";

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

  async findExpiringBefore(date: Date): Promise<{ userId: number }[]> {
    return db
      .select({ userId: calendarWatchState.userId })
      .from(calendarWatchState)
      .where(lt(calendarWatchState.expiration, date));
  },

  /**
   * Finds users who have a connected Google Calendar account (via Corsair)
   * but no `calendar_watch_state` row yet - i.e. accounts connected before
   * push notifications were wired up, which never called `events.watch`.
   */
  async findConnectedUserIdsWithoutWatch(): Promise<number[]> {
    const result = await db.execute<{ user_id: number }>(sql`
      SELECT DISTINCT (regexp_match(ca.tenant_id, '^user_(\\d+)$'))[1]::int AS user_id
      FROM corsair_accounts ca
      JOIN corsair_integrations ci ON ci.id = ca.integration_id
      WHERE ci.name = 'googlecalendar'
        AND ca.dek IS NOT NULL
        AND ca.tenant_id ~ '^user_\\d+$'
        AND NOT EXISTS (
          SELECT 1 FROM calendar_watch_state cws WHERE cws.user_id = (regexp_match(ca.tenant_id, '^user_(\\d+)$'))[1]::int
        )
    `);
    return result.rows.map((row) => row.user_id);
  },
};
