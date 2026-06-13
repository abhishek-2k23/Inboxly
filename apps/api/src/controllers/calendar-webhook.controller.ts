import { calendarEvents } from "../lib/calendar-events.js";
import { env } from "../env.js";
import { calendarWatchModel } from "../models/calendar-watch.model.js";
import { calendarService } from "../services/calendar.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const INCREMENTAL_SYNC_LIMIT = 20;

/**
 * Handles Google Calendar push notifications (`events.watch`). Unlike Gmail,
 * Calendar posts directly to our webhook URL - no Pub/Sub envelope - with the
 * channel/resource identifying the change in `X-Goog-*` headers and an empty
 * body. We map `X-Goog-Channel-Id` back to a local user via
 * `calendar_watch_state`, then re-sync that user's upcoming events.
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
  console.log(`[calendar-webhook] resolved channelId=${channelId} -> userId=${userId}, resourceState=${resourceState}`);

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

  res.status(200).json({ ok: true });
});
