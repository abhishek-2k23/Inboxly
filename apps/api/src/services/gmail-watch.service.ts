import { corsair, toTenantId } from "../lib/corsair.js";
import { env } from "../env.js";
import { gmailWatchModel } from "../models/gmail-watch.model.js";
import { sleep } from "../utils/sleep.js";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";
const TOKEN_REFRESH_SKEW_SECONDS = 300;
const WATCH_RENEWAL_WINDOW_MS = 24 * 60 * 60 * 1000; // renew watches expiring within 24h
// Space out per-user Google API calls when sweeping many accounts at once -
// calling users.watch back-to-back for every account is what was tripping
// Google's rate limit.
const WATCH_SWEEP_DELAY_MS = 300;

interface GmailProfile {
  emailAddress?: string;
  historyId?: string;
}

/**
 * The corsair tenant client's plugin namespaces are inferred as `any` by the
 * SDK for this plugin combination (see email.service.ts), so we cast the
 * `.keys` surface we use to its documented shape here.
 */
type GmailAccountKeys = {
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
  historyId: string;
  expiration: string; // ms-since-epoch as a string, per Gmail API
}

function getTenant(userId: number) {
  return corsair.withTenant(toTenantId(userId));
}

function getAccountKeys(userId: number): GmailAccountKeys {
  return getTenant(userId).gmail.keys as GmailAccountKeys;
}

/**
 * Returns a valid (non-expired) Gmail OAuth access token for the user,
 * refreshing and persisting it via the account's refresh_token if needed.
 * Mirrors the refresh logic the gmail plugin's keyBuilder uses internally
 * (see @corsair-dev/gmail's keyBuilder), since `users.watch` has no bound
 * SDK endpoint and must be called directly against the Gmail REST API.
 */
async function getValidAccessToken(userId: number): Promise<string> {
  const keys = getAccountKeys(userId);
  const [accessToken, expiresAt, refreshToken] = await Promise.all([
    keys.get_access_token(),
    keys.get_expires_at(),
    keys.get_refresh_token(),
  ]);

  if (!refreshToken) {
    throw new Error(`Gmail account for user ${userId} is not connected`);
  }

  const now = Math.floor(Date.now() / 1000);
  if (accessToken && expiresAt && Number(expiresAt) > now + TOKEN_REFRESH_SKEW_SECONDS) {
    return accessToken;
  }

  const { client_id, client_secret } = await keys.get_integration_credentials();
  if (!client_id || !client_secret) {
    throw new Error("Gmail OAuth client credentials are not configured");
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
    throw new Error(`Failed to refresh Gmail access token: ${await response.text()}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  await keys.set_access_token(data.access_token);
  await keys.set_expires_at(String(now + data.expires_in));
  return data.access_token;
}

export const gmailWatchService = {
  /**
   * Registers (or renews) Gmail push notifications for the user's mailbox,
   * pointed at the shared Pub/Sub topic, and records the resulting
   * historyId/expiration so the webhook can map notifications back to this
   * user and the renewal job knows when to re-register.
   */
  async startWatch(userId: number): Promise<void> {
    if (!env.gmailPubsubTopic) {
      console.warn("[gmail-watch] GMAIL_PUBSUB_TOPIC is not set - skipping watch registration.");
      return;
    }

    const accessToken = await getValidAccessToken(userId);

    const profileResponse = await fetch(`${GMAIL_API_BASE}/users/me/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileResponse.ok) {
      throw new Error(
        `Failed to fetch Gmail profile for user ${userId}: ${await profileResponse.text()}`,
      );
    }
    const profile = (await profileResponse.json()) as GmailProfile;
    if (!profile.emailAddress) {
      throw new Error(`Gmail profile for user ${userId} has no emailAddress`);
    }

    const response = await fetch(`${GMAIL_API_BASE}/users/me/watch`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topicName: env.gmailPubsubTopic,
        labelIds: ["INBOX"],
        labelFilterAction: "include",
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to register Gmail watch for user ${userId}: ${await response.text()}`,
      );
    }

    const watch = (await response.json()) as WatchResponse;

    await gmailWatchModel.upsert({
      userId,
      emailAddress: profile.emailAddress,
      historyId: watch.historyId,
      expiration: new Date(Number(watch.expiration)),
    });

    console.log(
      `[gmail-watch] startWatch ok for user ${userId} (${profile.emailAddress}): historyId=${watch.historyId}, expires=${new Date(
        Number(watch.expiration),
      ).toISOString()}`,
    );
  },

  /**
   * Re-registers Gmail watches that expire within WATCH_RENEWAL_WINDOW_MS.
   * Google requires `users.watch` to be called at least every 7 days.
   */
  async renewExpiringWatches(): Promise<void> {
    if (!env.gmailPubsubTopic) return;

    const expiring = await gmailWatchModel.findExpiringBefore(
      new Date(Date.now() + WATCH_RENEWAL_WINDOW_MS),
    );
    console.log(
      `[gmail-watch] renewExpiringWatches: ${expiring.length} watch(es) expiring within 24h`,
    );
    for (const { userId } of expiring) {
      try {
        await gmailWatchService.startWatch(userId);
      } catch (error) {
        console.error(`[gmail-watch] Failed to renew watch for user ${userId}:`, error);
      }
      await sleep(WATCH_SWEEP_DELAY_MS);
    }
  },

  /**
   * Registers `users.watch` for any user with a connected Gmail account that
   * doesn't have a `gmail_watch_state` row yet - covers accounts connected
   * before push notifications were wired up (the OAuth callback only
   * registers the watch for newly-connected accounts).
   */
  async registerMissingWatches(): Promise<void> {
    if (!env.gmailPubsubTopic) return;

    const userIds = await gmailWatchModel.findConnectedUserIdsWithoutWatch();
    console.log(
      `[gmail-watch] registerMissingWatches: ${userIds.length} connected account(s) without a watch`,
    );
    for (const userId of userIds) {
      try {
        await gmailWatchService.startWatch(userId);
        console.log(`[gmail-watch] Registered watch for user ${userId}`);
      } catch (error) {
        console.error(`[gmail-watch] Failed to register watch for user ${userId}:`, error);
      }
      await sleep(WATCH_SWEEP_DELAY_MS);
    }
  },
};
