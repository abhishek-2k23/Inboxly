import type { ApiError, GoogleIntegrationPlugin, IntegrationStatusResponse } from "@repo/shared";
import { generateOAuthUrl, processOAuthCallback } from "corsair/oauth";
import { env } from "../env.js";
import { corsair, fromTenantId, GOOGLE_OAUTH_REDIRECT_URI, toTenantId } from "../lib/corsair.js";
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
  const { url } = await generateOAuthUrl(corsair, plugin, {
    tenantId,
    redirectUri: GOOGLE_OAUTH_REDIRECT_URI,
  });

  res.redirect(url);
});

export const googleOAuthCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query as { code?: string; state?: string; error?: string };

  if (error || !code || !state) {
    res.redirect(
      `${env.webAppUrl}/onboarding?error=${encodeURIComponent(error ?? "missing_code")}`,
    );
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

    res.redirect(`${env.webAppUrl}/onboarding?connected=${encodeURIComponent(plugin)}`);
  } catch (err) {
    console.error("[corsair] Google OAuth callback failed", err);
    res.redirect(`${env.webAppUrl}/onboarding?error=callback_failed`);
  }
});
