import crypto from "node:crypto";
import { corsair, toTenantId } from "../lib/corsair.js";
import { env } from "../env.js";
import { calendarWatchModel } from "../models/calendar-watch.model.js";
import { sleep } from "../utils/sleep.js";

const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";
const TOKEN_REFRESH_SKEW_SECONDS = 300;
const WATCH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // request a 7-day channel, renewed before it expires
const WATCH_RENEWAL_WINDOW_MS = 24 * 60 * 60 * 1000; // renew channels expiring within 24h
const DEFAULT_CALENDAR_ID = "primary";
// Space out per-user Google API calls when sweeping many accounts at once -
// calling events.watch back-to-back for every account is what was tripping
// Google's rate limit.
const WATCH_SWEEP_DELAY_MS = 300;

/**
 * The corsair tenant client's plugin namespaces are inferred as `any` by the
 * SDK for this plugin combination (see calendar.service.ts), so we cast the
 * `.keys` surface we use to its documented shape here.
 */
type GoogleCalendarAccountKeys = {
  get_access_token: () => Promise<string | null>;
  get_refresh_token: () => Promise<string | null>;
  get_expires_at: () => Promise<string | null>;
  set_access_token: (value: string | null) => Promise<void>;
  set_expires_at: (value: string | null) => Promise<void>;
  get_integration_credentials: () => Promise<{
    client_id: string | null;
    client_secret: string | null;
    redirect_url: string | null;
  }>;
};

interface WatchResponse {
  resourceId: string;
  expiration: string; // ms-since-epoch as a string, per Google API
}

function getTenant(userId: number) {
  return corsair.withTenant(toTenantId(userId));
}

function getAccountKeys(userId: number): GoogleCalendarAccountKeys {
  return getTenant(userId).googlecalendar.keys as GoogleCalendarAccountKeys;
}

function webhookAddress(): string {
  return `${env.apiBaseUrl}/api/webhooks/calendar`;
}

/**
 * Returns a valid (non-expired) Google OAuth access token for the user,
 * refreshing and persisting it via the account's refresh_token if needed.
 * Mirrors gmail-watch.service.ts's getValidAccessToken, since `events.watch`
 * / `channels.stop` have no bound SDK endpoints and must be called directly
 * against the Calendar REST API.
 */
async function getValidAccessToken(userId: number): Promise<string> {
  const keys = getAccountKeys(userId);
  const [accessToken, expiresAt, refreshToken] = await Promise.all([
    keys.get_access_token(),
    keys.get_expires_at(),
    keys.get_refresh_token(),
  ]);

  if (!refreshToken) {
    throw new Error(`Google Calendar account for user ${userId} is not connected`);
  }

  const now = Math.floor(Date.now() / 1000);
  if (accessToken && expiresAt && Number(expiresAt) > now + TOKEN_REFRESH_SKEW_SECONDS) {
    return accessToken;
  }

  const { client_id, client_secret } = await keys.get_integration_credentials();
  if (!client_id || !client_secret) {
    throw new Error("Google OAuth client credentials are not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id,
      client_secret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh Google Calendar access token: ${await response.text()}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  await keys.set_access_token(data.access_token);
  await keys.set_expires_at(String(now + data.expires_in));
  return data.access_token;
}

export const calendarWatchService = {
  /**
   * Registers a push notification channel for the user's primary calendar
   * (`events.watch`), pointed directly at our webhook endpoint - no Pub/Sub
   * topic needed, unlike Gmail. Records the channel/resource id and
   * expiration so the webhook can map notifications back to this user and
   * the renewal job knows when to re-register.
   */
  async startWatch(userId: number): Promise<void> {
    if (!env.apiBaseUrl.startsWith("https://")) {
      console.warn(
        `[calendar-watch] API_BASE_URL (${env.apiBaseUrl}) is not HTTPS - Google requires a public HTTPS webhook ` +
          "address, so calendar push notifications are disabled.",
      );
      return;
    }

    const accessToken = await getValidAccessToken(userId);
    const channelId = crypto.randomUUID();

    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(DEFAULT_CALENDAR_ID)}/events/watch`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: channelId,
          type: "web_hook",
          address: webhookAddress(),
          token: env.calendarWebhookToken || undefined,
          expiration: String(Date.now() + WATCH_TTL_MS),
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to register Calendar watch for user ${userId}: ${await response.text()}`,
      );
    }

    const watch = (await response.json()) as WatchResponse;

    await calendarWatchModel.upsert({
      userId,
      calendarId: DEFAULT_CALENDAR_ID,
      channelId,
      resourceId: watch.resourceId,
      expiration: new Date(Number(watch.expiration)),
    });

    console.log(
      `[calendar-watch] startWatch ok for user ${userId}: channelId=${channelId}, expires=${new Date(
        Number(watch.expiration),
      ).toISOString()}`,
    );
  },

  /**
   * Stops a previously-registered push notification channel. Best-effort -
   * failures (e.g. the channel already expired) are logged and swallowed so
   * renewal can still proceed to register a fresh channel.
   */
  async stopWatch(userId: number, channelId: string, resourceId: string): Promise<void> {
    try {
      const accessToken = await getValidAccessToken(userId);
      const response = await fetch(`${CALENDAR_API_BASE}/channels/stop`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: channelId, resourceId }),
      });
      if (!response.ok) {
        console.warn(
          `[calendar-watch] Failed to stop channel ${channelId} for user ${userId}: ${await response.text()}`,
        );
      }
    } catch (error) {
      console.warn(
        `[calendar-watch] Failed to stop channel ${channelId} for user ${userId}:`,
        error,
      );
    }
  },

  /**
   * Re-registers Calendar watch channels that expire within
   * WATCH_RENEWAL_WINDOW_MS. Channels can't be extended in place, so the old
   * channel is stopped and a brand-new channel id is generated.
   */
  async renewExpiringWatches(): Promise<void> {
    const expiring = await calendarWatchModel.findExpiringBefore(
      new Date(Date.now() + WATCH_RENEWAL_WINDOW_MS),
    );
    console.log(
      `[calendar-watch] renewExpiringWatches: ${expiring.length} watch(es) expiring within 24h`,
    );
    for (const { userId } of expiring) {
      try {
        await calendarWatchService.startWatch(userId);
      } catch (error) {
        console.error(`[calendar-watch] Failed to renew watch for user ${userId}:`, error);
      }
      await sleep(WATCH_SWEEP_DELAY_MS);
    }
  },

  /**
   * Registers `events.watch` for any user with a connected Google Calendar
   * account that doesn't have a `calendar_watch_state` row yet - covers
   * accounts connected before push notifications were wired up.
   */
  async registerMissingWatches(): Promise<void> {
    const userIds = await calendarWatchModel.findConnectedUserIdsWithoutWatch();
    console.log(
      `[calendar-watch] registerMissingWatches: ${userIds.length} connected account(s) without a watch`,
    );
    for (const userId of userIds) {
      try {
        await calendarWatchService.startWatch(userId);
        console.log(`[calendar-watch] Registered watch for user ${userId}`);
      } catch (error) {
        console.error(`[calendar-watch] Failed to register watch for user ${userId}:`, error);
      }
      await sleep(WATCH_SWEEP_DELAY_MS);
    }
  },
};
