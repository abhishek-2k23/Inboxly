import type { ApiError, EmailListResponse, EmailSearchResponse, EmailSyncResponse } from "@repo/shared";
import { emailService } from "../services/email.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listEmailsQuerySchema,
  searchEmailsQuerySchema,
  type SyncEmailsInput,
} from "../validations/email.validation.js";

export const syncEmails = asyncHandler(async (req, res) => {
  const { maxResults } = req.body as SyncEmailsInput;
  const result = await emailService.syncInbox(req.localUser!.id, maxResults);
  const response: EmailSyncResponse = result;
  res.json(response);
});

export const listEmails = asyncHandler(async (req, res) => {
  const parsed = listEmailsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const error: ApiError = { error: parsed.error.issues.map((issue) => issue.message).join(", ") };
    res.status(400).json(error);
    return;
  }

  const emails = await emailService.listInbox(req.localUser!.id, parsed.data);
  const response: EmailListResponse = { emails };
  res.json(response);
});

export const searchEmails = asyncHandler(async (req, res) => {
  const parsed = searchEmailsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const error: ApiError = { error: parsed.error.issues.map((issue) => issue.message).join(", ") };
    res.status(400).json(error);
    return;
  }

  const results = await emailService.searchInbox(req.localUser!.id, parsed.data.q, parsed.data.limit);
  const response: EmailSearchResponse = { results };
  res.json(response);
});
