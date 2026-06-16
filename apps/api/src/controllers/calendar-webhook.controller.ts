import { calendarEvents } from "../lib/calendar-events.js";
import { env } from "../env.js";
import { calendarWatchModel } from "../models/calendar-watch.model.js";
import { calendarService } from "../services/calendar.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createKeyedDebouncer } from "../utils/keyed-debouncer.js";

const INCREMENTAL_SYNC_LIMIT = 20;

// Coalesces a burst of pings for the same user into one sync - same
// rationale as gmail-webhook.controller.ts's SYNC_DEBOUNCE_MS.
const SYNC_DEBOUNCE_MS = 4000;

/**
 * Runs the actual re-sync for one user. Always called off the debouncer,
 * never directly from the request handler - see SYNC_DEBOUNCE_MS.
 */
const calendarSyncDebouncer = createKeyedDebouncer<number>(async (userId) => {
  // Calendar notifications don't say what changed, only that *something*
  // did, so re-sync the upcoming events window and only notify the frontend
  // when calendarService.embedEvent() found content it hasn't seen before -
  // i.e. a genuinely new or rescheduled event, not a no-op re-sync.
  try {
    const syncResult = await calendarService.syncEvents(userId, INCREMENTAL_SYNC_LIMIT);
    console.log(`[calendar-webhook] incremental sync for user ${userId}:`, syncResult);
    if (syncResult.embedded > 0) {
      calendarEvents.publish(userId, { type: "calendar-updated", ...syncResult });
    } else {
      console.log(`[calendar-webhook] no new/changed events for user ${userId}, skipping notify`);
    }
  } catch (error) {
    console.error(`[calendar-webhook] Incremental sync failed for user ${userId}:`, error);
  }
}, SYNC_DEBOUNCE_MS);

/**
 * Handles Google Calendar push notifications (`events.watch`). Unlike Gmail,
 * Calendar posts directly to our webhook URL - no Pub/Sub envelope - with the
 * channel/resource identifying the change in `X-Goog-*` headers and an empty
 * body. We map `X-Goog-Channel-Id` back to a local user via
 * `calendar_watch_state`.
 *
 * Acks (`res.status(200)`) right after resolving the user, *before* doing any
 * sync work, and runs the actual re-sync off a per-user debouncer instead -
 * same rationale as handleGmailWebhook: don't make Google wait on a full
 * sync, and collapse bursts of change notifications into one sync.
 */
export const handleCalendarWebhook = asyncHandler(async (req, res) => {
  const channelId = req.header("x-goog-channel-id");
  const resourceState = req.header("x-goog-resource-state");
  const channelToken = req.header("x-goog-channel-token");

  console.log("[calendar-webhook] received push notification", {
    channelId,
    resourceState,
    resourceId: req.header("x-goog-resource-id"),
  });

  if (env.calendarWebhookToken && channelToken !== env.calendarWebhookToken) {
    console.warn("[calendar-webhook] rejected: invalid or missing channel token");
    res.status(401).end();
    return;
  }

  if (!channelId) {
    res.status(200).json({ ok: true, skipped: "no_channel_id" });
    return;
  }

  const watch = await calendarWatchModel.findByChannelId(channelId);
  if (!watch) {
    console.warn(`[calendar-webhook] no local watch found for channelId=${channelId}`);
    res.status(200).json({ ok: true, skipped: "unknown_channel" });
    return;
  }

  // The "sync" message is sent once immediately after the channel is
  // created and doesn't represent a real change - just ack it.
  if (resourceState === "sync") {
    res.status(200).json({ ok: true, skipped: "sync" });
    return;
  }

  const { userId } = watch;
  console.log(
    `[calendar-webhook] resolved channelId=${channelId} -> userId=${userId}, resourceState=${resourceState}`,
  );

  res.status(200).json({ ok: true, queued: true });

  calendarSyncDebouncer.trigger(userId);
});
