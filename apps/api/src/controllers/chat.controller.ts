import type { ApiError, ChatRequest, ChatResponse } from "@repo/shared";
import { calendarEvents } from "../lib/calendar-events.js";
import { chatModel } from "../models/chat.model.js";
import { MAX_ATTACHMENT_BYTES, PLAN_LIMITS, PlanLimitError } from "../services/account.service.js";
import { chatService } from "../services/chat.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listConversations = asyncHandler(async (req, res) => {
  const userId = req.localUser!.id;
  const conversations = await chatModel.listConversations(userId);
  res.json({ conversations });
});

export const postChat = asyncHandler(async (req, res) => {
  const { messages, timeZone, conversationId, attachments } = req.body as ChatRequest;
  const user = req.localUser!;
  const userId = user.id;
  // Fall back to the free plan's caps if the plan is somehow unset.
  const plan = PLAN_LIMITS[user.subscriptionType] ?? PLAN_LIMITS.free;

  try {
    const {
      message,
      calendarEvents: createdEvents,
      referencedEmails,
      conversationId: resolvedConversationId,
      emailSent,
      calendarChanged,
    } = await chatService.getCompletion(userId, messages, {
      sender: { firstName: user.firstName, lastName: user.lastName, email: user.email },
      timeZone,
      conversationId,
      attachments,
      maxBytesPerFile: MAX_ATTACHMENT_BYTES[user.subscriptionType] ?? MAX_ATTACHMENT_BYTES.free,
      chatDepthLimit: plan.chatDepth,
    });
    if (calendarChanged) {
      // A create/update/delete happened - nudge the calendar view to refresh.
      // `createdEvents` only covers creates/updates; deletes change nothing here
      // but still flip `calendarChanged`, so fall back to 1 to signal a change.
      const changedCount = createdEvents.length || 1;
      calendarEvents.publish(userId, {
        type: "calendar-updated",
        synced: changedCount,
        embedded: changedCount,
      });
    }
    const response: ChatResponse = {
      message,
      calendarEvents: createdEvents,
      referencedEmails: referencedEmails.length > 0 ? referencedEmails : undefined,
      conversationId: resolvedConversationId,
      emailSent,
    };
    res.json(response);
  } catch (err) {
    if (err instanceof PlanLimitError) {
      // e.g. the chat hit its per-chat message cap ("chatDepth").
      const error: ApiError = { error: `limit:${err.metric}` };
      res.status(402).json(error);
      return;
    }
    console.error("OpenAI request failed", err);
    const error: ApiError = { error: "Failed to get a response from the AI provider" };
    res.status(502).json(error);
  }
});
