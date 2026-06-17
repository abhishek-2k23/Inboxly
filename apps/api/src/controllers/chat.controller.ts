import type { ApiError, ChatRequest, ChatResponse } from "@repo/shared";
import { calendarEvents } from "../lib/calendar-events.js";
import { chatService } from "../services/chat.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const postChat = asyncHandler(async (req, res) => {
  const { messages, timeZone, conversationId } = req.body as ChatRequest;
  const user = req.localUser!;
  const userId = user.id;

  try {
    const {
      message,
      calendarEvents: createdEvents,
      conversationId: resolvedConversationId,
    } = await chatService.getCompletion(userId, messages, {
      sender: { firstName: user.firstName, lastName: user.lastName, email: user.email },
      timeZone,
      conversationId,
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
    };
    res.json(response);
  } catch (err) {
    console.error("OpenAI request failed", err);
    const error: ApiError = { error: "Failed to get a response from the AI provider" };
    res.status(502).json(error);
  }
});
