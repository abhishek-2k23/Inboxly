import type {
  ApiError,
  CalendarEventDetailResponse,
  CalendarEventListResponse,
  CalendarEventMutationResponse,
  CalendarEventSearchResponse,
  CalendarSyncResponse,
} from "@repo/shared";
import { calendarEvents } from "../lib/calendar-events.js";
import { calendarService } from "../services/calendar.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  calendarEventIdParamSchema,
  createCalendarEventSchema,
  listCalendarEventsQuerySchema,
  searchCalendarEventsQuerySchema,
  updateCalendarEventSchema,
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

  const results = await calendarService.searchEvents(
    req.localUser!.id,
    parsed.data.q,
    parsed.data.limit,
  );
  const response: CalendarEventSearchResponse = { results };
  res.json(response);
});

export const getCalendarEvent = asyncHandler(async (req, res) => {
  const parsed = calendarEventIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    const error: ApiError = { error: parsed.error.issues.map((issue) => issue.message).join(", ") };
    res.status(400).json(error);
    return;
  }

  const event = await calendarService.getEvent(req.localUser!.id, parsed.data.id);
  if (!event) {
    const error: ApiError = { error: "Event not found" };
    res.status(404).json(error);
    return;
  }

  const response: CalendarEventDetailResponse = { event };
  res.json(response);
});

export const createCalendarEvent = asyncHandler(async (req, res) => {
  const parsed = createCalendarEventSchema.safeParse(req.body);
  if (!parsed.success) {
    const error: ApiError = { error: parsed.error.issues.map((issue) => issue.message).join(", ") };
    res.status(400).json(error);
    return;
  }

  const userId = req.localUser!.id;
  const event = await calendarService.createEvent(userId, parsed.data);
  calendarEvents.publish(userId, { type: "calendar-updated", synced: 1, embedded: 1 });

  const response: CalendarEventMutationResponse = { event };
  res.status(201).json(response);
});

export const updateCalendarEvent = asyncHandler(async (req, res) => {
  const parsedParams = calendarEventIdParamSchema.safeParse(req.params);
  const parsedBody = updateCalendarEventSchema.safeParse(req.body);
  if (!parsedParams.success || !parsedBody.success) {
    const issues = [
      ...(parsedParams.success ? [] : parsedParams.error.issues),
      ...(parsedBody.success ? [] : parsedBody.error.issues),
    ];
    const error: ApiError = { error: issues.map((issue) => issue.message).join(", ") };
    res.status(400).json(error);
    return;
  }

  const userId = req.localUser!.id;
  const event = await calendarService.updateEvent(userId, parsedParams.data.id, parsedBody.data);
  if (!event) {
    const error: ApiError = { error: "Event not found" };
    res.status(404).json(error);
    return;
  }

  calendarEvents.publish(userId, { type: "calendar-updated", synced: 1, embedded: 1 });

  const response: CalendarEventMutationResponse = { event };
  res.json(response);
});

export const deleteCalendarEvent = asyncHandler(async (req, res) => {
  const parsed = calendarEventIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    const error: ApiError = { error: parsed.error.issues.map((issue) => issue.message).join(", ") };
    res.status(400).json(error);
    return;
  }

  const userId = req.localUser!.id;
  await calendarService.deleteEvent(userId, parsed.data.id);
  calendarEvents.publish(userId, { type: "calendar-updated", synced: 0, embedded: 0 });

  res.status(204).send();
});
