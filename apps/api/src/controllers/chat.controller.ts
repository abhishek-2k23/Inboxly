import type { ApiError, ChatRequest, ChatResponse } from "@repo/shared";
import { calendarEvents } from "../lib/calendar-events.js";
import { MAX_ATTACHMENT_BYTES } from "../services/account.service.js";
import { chatService } from "../services/chat.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const postChat = asyncHandler(async (req, res) => {
  const { messages, timeZone, conversationId, attachments } = req.body as ChatRequest;
  const user = req.localUser!;
  const userId = user.id;

  try {
    const {
      message,
      calendarEvents: createdEvents,
      conversationId: resolvedConversationId,
      emailSent,
    } = await chatService.getCompletion(userId, messages, {
      sender: { firstName: user.firstName, lastName: user.lastName, email: user.email },
      timeZone,
      conversationId,
      attachments,
      maxBytesPerFile: MAX_ATTACHMENT_BYTES[user.subscriptionType],
    });
    if (createdEvents.length > 0) {
      calendarEvents.publish(userId, {
        type: "calendar-updated",
        synced: createdEvents.length,
        embedded: createdEvents.length,
      });
    }
    const response: ChatResponse = {
      message,
      calendarEvents: createdEvents,
      conversationId: resolvedConversationId,
      emailSent,
    };
    res.json(response);
  } catch (err) {
    console.error("OpenAI request failed", err);
    const error: ApiError = { error: "Failed to get a response from the AI provider" };
    res.status(502).json(error);
  }
});
