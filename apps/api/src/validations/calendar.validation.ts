import { z } from "zod";

export const syncCalendarSchema = z.object({
  maxResults: z.coerce.number().int().min(1).max(500).optional(),
});

const calendarEventDateTimeSchema = z
  .object({
    date: z.string().optional(),
    dateTime: z.string().optional(),
    timeZone: z.string().optional(),
  })
  .refine((value) => Boolean(value.date || value.dateTime), {
    message: "Either date or dateTime is required",
  });

const calendarEventAttendeeSchema = z.object({
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  optional: z.boolean().optional(),
  responseStatus: z.enum(["needsAction", "declined", "tentative", "accepted"]).optional(),
});

const calendarEventInputSchema = z.object({
  summary: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  start: calendarEventDateTimeSchema.optional(),
  end: calendarEventDateTimeSchema.optional(),
  attendees: z.array(calendarEventAttendeeSchema).optional(),
});

export const createCalendarEventSchema = calendarEventInputSchema.extend({
  summary: z.string().trim().min(1, "summary is required"),
  start: calendarEventDateTimeSchema,
  end: calendarEventDateTimeSchema,
});

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;

export const updateCalendarEventSchema = calendarEventInputSchema;

export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>;

export const calendarEventIdParamSchema = z.object({
  id: z.string().trim().min(1, "id is required"),
});

export type CalendarEventIdParam = z.infer<typeof calendarEventIdParamSchema>;

export type SyncCalendarInput = z.infer<typeof syncCalendarSchema>;

export const listCalendarEventsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type ListCalendarEventsQuery = z.infer<typeof listCalendarEventsQuerySchema>;

export const searchCalendarEventsQuerySchema = z.object({
  q: z.string().trim().min(1, "q is required"),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export type SearchCalendarEventsQuery = z.infer<typeof searchCalendarEventsQuerySchema>;
