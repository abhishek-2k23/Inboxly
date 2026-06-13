import type { ApiError, CalendarEventListResponse, CalendarEventSearchResponse, CalendarSyncResponse } from "@repo/shared";
import { calendarEvents } from "../lib/calendar-events.js";
import { calendarService } from "../services/calendar.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listCalendarEventsQuerySchema,
  searchCalendarEventsQuerySchema,
  type SyncCalendarInput,
} from "../validations/calendar.validation.js";

export const syncCalendar = asyncHandler(async (req, res) => {
  const { maxResults } = req.body as SyncCalendarInput;
  const userId = req.localUser!.id;
  const result = await calendarService.syncEvents(userId, maxResults);
  calendarEvents.publish(userId, { type: "calendar-updated", ...result });
  const response: CalendarSyncResponse = result;
  res.json(response);
});

/**
 * Server-Sent Events stream that notifies the frontend when calendar events
 * have been synced (via manual sync or the Calendar push notification
 * webhook), so the schedule can refresh itself without polling.
 */
export const streamCalendarEvents = asyncHandler(async (req, res) => {
  const userId = req.localUser!.id;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(": connected\n\n");

  calendarEvents.subscribe(userId, res);

  const heartbeat = setInterval(() => {
    res.write(": ping\n\n");
  }, 30_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    calendarEvents.unsubscribe(userId, res);
  });
});

export const listCalendarEvents = asyncHandler(async (req, res) => {
  const parsed = listCalendarEventsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const error: ApiError = { error: parsed.error.issues.map((issue) => issue.message).join(", ") };
    res.status(400).json(error);
    return;
  }

  const events = await calendarService.listEvents(req.localUser!.id, parsed.data);
  const response: CalendarEventListResponse = { events };
  res.json(response);
});

export const searchCalendarEvents = asyncHandler(async (req, res) => {
  const parsed = searchCalendarEventsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const error: ApiError = { error: parsed.error.issues.map((issue) => issue.message).join(", ") };
    res.status(400).json(error);
    return;
  }

  const results = await calendarService.searchEvents(req.localUser!.id, parsed.data.q, parsed.data.limit);
  const response: CalendarEventSearchResponse = { results };
  res.json(response);
});
