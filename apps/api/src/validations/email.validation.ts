import { z } from "zod";

export const syncEmailsSchema = z.object({
  maxResults: z.coerce.number().int().min(1).max(500).optional(),
});

export type SyncEmailsInput = z.infer<typeof syncEmailsSchema>;

export const listEmailsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type ListEmailsQuery = z.infer<typeof listEmailsQuerySchema>;

export const searchEmailsQuerySchema = z.object({
  q: z.string().trim().min(1, "q is required"),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export type SearchEmailsQuery = z.infer<typeof searchEmailsQuerySchema>;

export const emailIdParamSchema = z.object({
  id: z.string().trim().min(1, "id is required"),
});

export type EmailIdParam = z.infer<typeof emailIdParamSchema>;
