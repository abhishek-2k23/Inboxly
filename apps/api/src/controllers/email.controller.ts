import type {
  ApiError,
  EmailDetailResponse,
  EmailListResponse,
  EmailSearchResponse,
  EmailSendResponse,
  EmailSyncResponse,
} from "@repo/shared";
import { emailEvents } from "../lib/email-events.js";
import { emailService } from "../services/email.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  emailIdParamSchema,
  listEmailsQuerySchema,
  searchEmailsQuerySchema,
  type SendEmailInput,
  type SyncEmailsInput,
} from "../validations/email.validation.js";

export const syncEmails = asyncHandler(async (req, res) => {
  const { maxResults } = req.body as SyncEmailsInput;
  const userId = req.localUser!.id;
  const result = await emailService.syncInbox(userId, maxResults);
  emailEvents.publish(userId, { type: "inbox-updated", ...result });
  const response: EmailSyncResponse = result;
  res.json(response);
});

/**
 * Server-Sent Events stream that notifies the frontend when new emails have
 * been synced (via manual sync or the Gmail Pub/Sub webhook), so the inbox
 * can refresh itself without polling.
 */
export const streamEmails = asyncHandler(async (req, res) => {
  const userId = req.localUser!.id;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(": connected\n\n");

  emailEvents.subscribe(userId, res);

  const heartbeat = setInterval(() => {
    res.write(": ping\n\n");
  }, 30_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    emailEvents.unsubscribe(userId, res);
  });
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

  const results = await emailService.searchInbox(
    req.localUser!.id,
    parsed.data.q,
    parsed.data.limit,
  );
  const response: EmailSearchResponse = { results };
  res.json(response);
});

export const getEmail = asyncHandler(async (req, res) => {
  const parsed = emailIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    const error: ApiError = { error: parsed.error.issues.map((issue) => issue.message).join(", ") };
    res.status(400).json(error);
    return;
  }

  const email = await emailService.getEmailById(req.localUser!.id, parsed.data.id);
  if (!email) {
    const error: ApiError = { error: "Email not found" };
    res.status(404).json(error);
    return;
  }

  const response: EmailDetailResponse = { email };
  res.json(response);
});

export const listSentEmails = asyncHandler(async (req, res) => {
  const parsed = listEmailsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const error: ApiError = { error: parsed.error.issues.map((issue) => issue.message).join(", ") };
    res.status(400).json(error);
    return;
  }

  const emails = await emailService.listSent(req.localUser!.id, parsed.data.limit);
  const response: EmailListResponse = { emails };
  res.json(response);
});

export const listArchivedEmails = asyncHandler(async (req, res) => {
  const parsed = listEmailsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const error: ApiError = { error: parsed.error.issues.map((issue) => issue.message).join(", ") };
    res.status(400).json(error);
    return;
  }

  const emails = await emailService.listArchived(req.localUser!.id, parsed.data.limit);
  const response: EmailListResponse = { emails };
  res.json(response);
});

export const archiveEmail = asyncHandler(async (req, res) => {
  const parsed = emailIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    const error: ApiError = { error: parsed.error.issues.map((issue) => issue.message).join(", ") };
    res.status(400).json(error);
    return;
  }

  const email = await emailService.archiveEmail(req.localUser!.id, parsed.data.id);
  if (!email) {
    const error: ApiError = { error: "Email not found" };
    res.status(404).json(error);
    return;
  }

  const response: EmailDetailResponse = { email };
  res.json(response);
});

export const sendEmail = asyncHandler(async (req, res) => {
  const { to, cc, bcc, subject, body, replyToEmailId } = req.body as SendEmailInput;
  const result = await emailService.sendEmail(req.localUser!.id, {
    to,
    cc,
    bcc,
    subject,
    body,
    replyToEmailId,
  });
  const response: EmailSendResponse = result;
  res.json(response);
});
