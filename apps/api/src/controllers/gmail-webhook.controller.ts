import type { IncomingHttpHeaders } from "node:http";
import { processWebhook } from "corsair";
import { corsair, toTenantId } from "../lib/corsair.js";
import { emailEvents } from "../lib/email-events.js";
import { env } from "../env.js";
import { gmailWatchModel } from "../models/gmail-watch.model.js";
import { emailService } from "../services/email.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createKeyedDebouncer } from "../utils/keyed-debouncer.js";

const INCREMENTAL_SYNC_LIMIT = 10;

// Coalesces a burst of pings for the same user into one sync, run this long
// after the first ping in the burst. Gmail fires this webhook on every
// history change (reads, archives, stars, not just new mail), so without
// this a few seconds of normal inbox activity meant a few seconds of
// separate full syncs back to back - see the doc comment on
// handleGmailWebhook for why that was tripping Gmail's rate limit.
const SYNC_DEBOUNCE_MS = 4000;

interface PubSubPushBody {
  [key: string]: unknown;
  message?: { data?: string; messageId?: string };
}

interface GmailPushPayload {
  emailAddress?: string;
  historyId?: string;
}

function decodePubSubMessage(data: string): GmailPushPayload {
  try {
    return JSON.parse(Buffer.from(data, "base64").toString("utf8")) as GmailPushPayload;
  } catch {
    return {};
  }
}

interface DebouncedSyncPayload {
  headers: IncomingHttpHeaders;
  body: PubSubPushBody;
}

/**
 * Runs the actual sync for one user: Corsair's own history-based sync (via
 * `processWebhook`) plus our incremental `syncInbox` pass, which also
 * handles embedding. Always called off the debouncer, never directly from
 * the request handler - see SYNC_DEBOUNCE_MS.
 */
const gmailSyncDebouncer = createKeyedDebouncer<number, DebouncedSyncPayload>(
  async (userId, { headers, body }) => {
    const tenantId = toTenantId(userId);

    try {
      const result = await processWebhook(corsair, headers, body, { tenantId });
      console.log(`[gmail-webhook] processWebhook result for user ${userId}`, result);
    } catch (error) {
      console.error(`[gmail-webhook] processWebhook failed for user ${userId}:`, error);
    }

    // Gmail's watch fires for every history change on the INBOX label (reads,
    // archives, stars, etc.), not just new mail, and `processWebhook`'s result
    // doesn't expose enough detail to tell those apart. Instead, run the
    // incremental sync unconditionally but only notify the frontend when
    // `embedded > 0` - emailService.embedMessage() only embeds messages whose
    // content hash hasn't been seen before, so label-only changes to already
    // -synced messages leave `embedded` at 0.
    try {
      const syncResult = await emailService.syncInbox(userId, INCREMENTAL_SYNC_LIMIT);
      console.log(`[gmail-webhook] incremental sync for user ${userId}:`, syncResult);
      if (syncResult.embedded > 0) {
        emailEvents.publish(userId, { type: "inbox-updated", ...syncResult });
      } else {
        console.log(`[gmail-webhook] no new messages for user ${userId}, skipping notify`);
      }
    } catch (error) {
      console.error(`[gmail-webhook] Incremental sync failed for user ${userId}:`, error);
    }
  },
  SYNC_DEBOUNCE_MS,
);

/**
 * Handles Gmail Pub/Sub push notifications. The push subscription posts to a
 * single shared endpoint for every connected Gmail account, so we decode the
 * `emailAddress` from the notification first to resolve which local user (and
 * therefore which Corsair tenant) it belongs to.
 *
 * Acks (`res.status(200)`) right after resolving the user, *before* doing any
 * sync work, and runs the actual sync off a per-user debouncer instead.
 * Pub/Sub's default ack deadline is 10s, well under what a full sync (Gmail
 * history lookup + up to 10 message fetches + embeddings) can take - acking
 * late meant Pub/Sub would redeliver the same notification and double the
 * work, which is what was tripping Gmail's per-user rate limit.
 */
export const handleGmailWebhook = asyncHandler(async (req, res) => {
  console.log("[gmail-webhook] received push notification", { query: req.query, body: req.body });

  if (env.gmailWebhookToken && req.query.token !== env.gmailWebhookToken) {
    console.warn("[gmail-webhook] rejected: invalid or missing token");
    res.status(401).end();
    return;
  }

  const body = req.body as PubSubPushBody;
  const data = body.message?.data;
  const payload = data ? decodePubSubMessage(data) : {};

  console.log("[gmail-webhook] decoded payload", payload);

  if (!payload.emailAddress) {
    res.status(200).json({ ok: true, skipped: "no_email_address" });
    return;
  }

  const userId = await gmailWatchModel.findUserIdByEmail(payload.emailAddress);
  if (!userId) {
    console.warn(`[gmail-webhook] no local user found for emailAddress=${payload.emailAddress}`);
    res.status(200).json({ ok: true, skipped: "unknown_account" });
    return;
  }

  console.log(
    `[gmail-webhook] resolved emailAddress=${payload.emailAddress} -> userId=${userId}, historyId=${payload.historyId}`,
  );

  res.status(200).json({ ok: true, queued: true });

  gmailSyncDebouncer.trigger(userId, { headers: req.headers, body });
});
