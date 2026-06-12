import type { ApiError, GoogleIntegrationPlugin, IntegrationStatusResponse } from "@repo/shared";
import { generateOAuthUrl, processOAuthCallback } from "corsair/oauth";
import { env } from "../env.js";
import { corsair, GOOGLE_OAUTH_REDIRECT_URI } from "../lib/corsair.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const GOOGLE_PLUGINS: readonly GoogleIntegrationPlugin[] = ["gmail", "googlecalendar"];

function isGooglePlugin(value: string): value is GoogleIntegrationPlugin {
  return (GOOGLE_PLUGINS as readonly string[]).includes(value);
}

export const getIntegrationStatus = asyncHandler(async (req, res) => {
  const tenantId = String(req.localUser!.id);
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

  const tenantId = String(req.localUser!.id);
  const { url } = await generateOAuthUrl(corsair, plugin, {
    tenantId,
    redirectUri: GOOGLE_OAUTH_REDIRECT_URI,
  });

  res.redirect(url);
});

export const googleOAuthCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query as { code?: string; state?: string; error?: string };

  if (error || !code || !state) {
    res.redirect(`${env.webAppUrl}/settings/integrations?error=${encodeURIComponent(error ?? "missing_code")}`);
    return;
  }

  try {
    const { plugin } = await processOAuthCallback(corsair, {
      code,
      state,
      redirectUri: GOOGLE_OAUTH_REDIRECT_URI,
    });
    res.redirect(`${env.webAppUrl}/settings/integrations?connected=${encodeURIComponent(plugin)}`);
  } catch (err) {
    console.error("[corsair] Google OAuth callback failed", err);
    res.redirect(`${env.webAppUrl}/settings/integrations?error=callback_failed`);
  }
});
