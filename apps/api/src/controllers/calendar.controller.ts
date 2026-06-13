import type { ApiError, CalendarEventListResponse, CalendarEventSearchResponse, CalendarSyncResponse } from "@repo/shared";
import { calendarService } from "../services/calendar.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listCalendarEventsQuerySchema,
  searchCalendarEventsQuerySchema,
  type SyncCalendarInput,
} from "../validations/calendar.validation.js";

export const syncCalendar = asyncHandler(async (req, res) => {
  const { maxResults } = req.body as SyncCalendarInput;
  const result = await calendarService.syncEvents(req.localUser!.id, maxResults);
  const response: CalendarSyncResponse = result;
  res.json(response);
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
