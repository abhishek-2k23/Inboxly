import { z } from "zod";

export const syncCalendarSchema = z.object({
  maxResults: z.coerce.number().int().min(1).max(500).optional(),
});

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
