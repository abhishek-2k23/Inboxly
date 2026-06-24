import type { ApiError, GoogleIntegrationPlugin, IntegrationStatusResponse } from "@repo/shared";
import { generateOAuthUrl, processOAuthCallback } from "corsair/oauth";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { pool } from "../db/pool.js";
import { calendarWatchState, gmailWatchState } from "../db/schema/index.js";
import { env } from "../env.js";
import {
  corsair,
  fromTenantId,
  GOOGLE_OAUTH_REDIRECT_URI,
  initCorsair,
  toTenantId,
} from "../lib/corsair.js";
import { calendarWatchService } from "../services/calendar-watch.service.js";
import { gmailWatchService } from "../services/gmail-watch.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const GOOGLE_PLUGINS: readonly GoogleIntegrationPlugin[] = ["gmail", "googlecalendar"];

function isGooglePlugin(value: string): value is GoogleIntegrationPlugin {
  return (GOOGLE_PLUGINS as readonly string[]).includes(value);
}

export const getIntegrationStatus = asyncHandler(async (req, res) => {
  const tenantId = toTenantId(req.localUser!.id);
  const status = await corsair.manage.connectionStatus.get({ tenantId });

  const response: IntegrationStatusResponse = {
    gmail: status.gmail ?? "not_connected",
    googlecalendar: status.googlecalendar ?? "not_connected",
  };
  res.json(response);
});

export const connectGoogleIntegration = asyncHandler(async (req, res) => {
  const { plugin } = req.params as { plugin: string };
  if (!isGooglePlugin(plugin)) {
    const error: ApiError = { error: `Unknown integration '${plugin}'` };
    res.status(404).json(error);
    return;
  }

  const tenantId = toTenantId(req.localUser!.id);

  let oauthResult: { url: string };
  try {
    oauthResult = await generateOAuthUrl(corsair, plugin, {
      tenantId,
      redirectUri: GOOGLE_OAUTH_REDIRECT_URI,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("not found")) {
      // corsair_integrations rows were wiped (e.g. DB reset). Re-seed and retry once.
      await initCorsair();
      oauthResult = await generateOAuthUrl(corsair, plugin, {
        tenantId,
        redirectUri: GOOGLE_OAUTH_REDIRECT_URI,
      });
    } else {
      throw err;
    }
  }

  const { url } = oauthResult;

  // Return the URL as JSON rather than redirecting: in production the web app
  // and API are on different domains, so this endpoint is reached via an
  // authenticated fetch (Bearer token) — a top-level popup navigation can't
  // carry the token and would 401. The client opens the returned URL itself.
  res.json({ url });
});

/**
 * Disconnects a Google integration: best-effort tears down the registered
 * push-notification watch, then removes the Corsair account (and its cached
 * entities/events, deleted first to satisfy FK constraints) so the
 * connection shows as "not_connected" and a future connect creates a fresh
 * account + DEK rather than reusing a now-credential-less row.
 */
export const disconnectGoogleIntegration = asyncHandler(async (req, res) => {
  const { plugin } = req.params as { plugin: string };
  if (!isGooglePlugin(plugin)) {
    const error: ApiError = { error: `Unknown integration '${plugin}'` };
    res.status(404).json(error);
    return;
  }

  const userId = req.localUser!.id;
  const tenantId = toTenantId(userId);

  if (plugin === "googlecalendar") {
    const [watch] = await db
      .select()
      .from(calendarWatchState)
      .where(eq(calendarWatchState.userId, userId));
    if (watch) {
      await calendarWatchService.stopWatch(userId, watch.channelId, watch.resourceId);
      await db.delete(calendarWatchState).where(eq(calendarWatchState.userId, userId));
    }
  } else {
    await db.delete(gmailWatchState).where(eq(gmailWatchState.userId, userId));
  }

  await pool.query(
    `WITH acct AS (
       SELECT a.id FROM corsair_accounts a
       JOIN corsair_integrations i ON i.id = a.integration_id
       WHERE i.name = $1 AND a.tenant_id = $2
     ),
     del_events AS (
       DELETE FROM corsair_events WHERE account_id IN (SELECT id FROM acct)
     ),
     del_entities AS (
       DELETE FROM corsair_entities WHERE account_id IN (SELECT id FROM acct)
     )
     DELETE FROM corsair_accounts WHERE id IN (SELECT id FROM acct)`,
    [plugin, tenantId],
  );

  const status = await corsair.manage.connectionStatus.get({ tenantId });
  const response: IntegrationStatusResponse = {
    gmail: status.gmail ?? "not_connected",
    googlecalendar: status.googlecalendar ?? "not_connected",
  };
  res.json(response);
});

/**
 * Corsair's state is a signed JWT whose payload contains the plugin name.
 * We decode it without verifying the signature here — we only need the plugin
 * to include in error redirects so the web app can reconcile that plugin's
 * state even when the full callback fails.
 */
function extractPluginFromState(state: string | undefined): string | null {
  if (!state) return null;
  try {
    const parts = state.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(Buffer.from(parts[1]!, "base64url").toString("utf-8")) as Record<
      string,
      unknown
    >;
    return typeof payload.plugin === "string" ? payload.plugin : null;
  } catch {
    return null;
  }
}

export const googleOAuthCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query as { code?: string; state?: string; error?: string };

  if (error || !code || !state) {
    const plugin = extractPluginFromState(state);
    const params = new URLSearchParams({ error: error ?? "missing_code" });
    if (plugin) params.set("plugin", plugin);
    res.redirect(`${env.webAppUrl}/oauth-complete?${params.toString()}`);
    return;
  }

  try {
    const { plugin, tenantId } = await processOAuthCallback(corsair, {
      code,
      state,
      redirectUri: GOOGLE_OAUTH_REDIRECT_URI,
    });

    if (plugin === "gmail") {
      const userId = fromTenantId(tenantId);
      if (userId !== null) {
        try {
          await gmailWatchService.startWatch(userId);
        } catch (watchErr) {
          console.error(`[gmail-watch] Failed to register watch for user ${userId}:`, watchErr);
        }
      }
    }

    if (plugin === "googlecalendar") {
      const userId = fromTenantId(tenantId);
      if (userId !== null) {
        try {
          await calendarWatchService.startWatch(userId);
        } catch (watchErr) {
          console.error(`[calendar-watch] Failed to register watch for user ${userId}:`, watchErr);
        }
      }
    }

    res.redirect(`${env.webAppUrl}/oauth-complete?connected=${encodeURIComponent(plugin)}`);
  } catch (err) {
    console.error("[corsair] Google OAuth callback failed", err);
    const plugin = extractPluginFromState(state);
    const params = new URLSearchParams({ error: "callback_failed" });
    if (plugin) params.set("plugin", plugin);
    res.redirect(`${env.webAppUrl}/oauth-complete?${params.toString()}`);
  }
});
