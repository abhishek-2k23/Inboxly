import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";
import { createCorsair } from "corsair";
import { setupCorsair } from "corsair/setup";
import { pool } from "../db/pool.js";
import { env } from "../env.js";

export const GOOGLE_OAUTH_REDIRECT_URI = `${env.apiBaseUrl}/api/integrations/google/callback`;

// Multi-tenant Corsair instance: one tenant per local user (tenantId = String(users.id)).
// Plugin credentials/entities/events live in the corsair_* tables (see db/init.sql).
export const corsair = createCorsair({
  plugins: [gmail(), googlecalendar()],
  database: pool,
  kek: env.corsairKek,
  multiTenancy: true,
  connect: {
    baseUrl: env.apiBaseUrl,
    redirectUri: GOOGLE_OAUTH_REDIRECT_URI,
  },
});

/**
 * Ensures `corsair_integrations` rows exist (with DEKs) for gmail and
 * googlecalendar, and stores the shared Google OAuth client_id/secret as
 * integration-level credentials. Safe to call on every boot.
 */
export async function initCorsair(): Promise<void> {
  if (!env.corsairKek) {
    console.warn("[corsair] CORSAIR_KEK is not set - skipping setup. See .env.example.");
    return;
  }

  const googleCredentials =
    env.googleClientId && env.googleClientSecret
      ? { client_id: env.googleClientId, client_secret: env.googleClientSecret }
      : undefined;

  await setupCorsair(corsair, {
    credentials: googleCredentials
      ? { gmail: googleCredentials, googlecalendar: googleCredentials }
      : undefined,
  });
}
