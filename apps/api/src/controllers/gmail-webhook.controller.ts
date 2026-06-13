import { processWebhook } from "corsair";
import { corsair, toTenantId } from "../lib/corsair.js";
import { emailEvents } from "../lib/email-events.js";
import { env } from "../env.js";
import { gmailWatchModel } from "../models/gmail-watch.model.js";
import { emailService } from "../services/email.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const INCREMENTAL_SYNC_LIMIT = 10;

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

/**
 * Handles Gmail Pub/Sub push notifications. The push subscription posts to a
 * single shared endpoint for every connected Gmail account, so we decode the
 * `emailAddress` from the notification first to resolve which local user (and
 * therefore which Corsair tenant) it belongs to before handing off to
 * `processWebhook`, which performs the actual history sync into
 * `corsair_entities`.
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

  console.log(`[gmail-webhook] resolved emailAddress=${payload.emailAddress} -> userId=${userId}, historyId=${payload.historyId}`);

  const tenantId = toTenantId(userId);
  const result = await processWebhook(corsair, req.headers, body, { tenantId });

  console.log("[gmail-webhook] processWebhook result", result);

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

  res.status(200).json({ ok: true });
});
