import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";
import { createCorsair } from "corsair";
import { setupCorsair } from "corsair/setup";
import { pool } from "../db/pool.js";
import { env } from "../env.js";

export const GOOGLE_OAUTH_REDIRECT_URI = `${env.apiBaseUrl}/api/integrations/google/callback`;

/**
 * Corsair's ORM layer JSON.parse's every string column before validating it
 * against its zod row schema, so a purely-numeric tenant_id like "1" comes
 * back as the number 1 and fails the `tenant_id: z.string()` check. Prefixing
 * with a non-numeric segment keeps it a string through that round trip.
 */
export function toTenantId(userId: number): string {
  return `user_${userId}`;
}

/**
 * Inverse of {@link toTenantId}. Returns `null` if the tenant id doesn't
 * match the `user_<id>` shape (e.g. the "default" tenant used by webhook
 * requests that don't specify a tenantId).
 */
export function fromTenantId(tenantId: string): number | null {
  const match = /^user_(\d+)$/.exec(tenantId);
  return match ? Number(match[1]) : null;
}

// Multi-tenant Corsair instance: one tenant per local user (tenantId = toTenantId(users.id)).
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

  if (env.gmailPubsubTopic) {
    await corsair.keys.gmail.set_topic_id(env.gmailPubsubTopic);
  } else {
    console.warn("[corsair] GMAIL_PUBSUB_TOPIC is not set - Gmail push notifications are disabled.");
  }
}
