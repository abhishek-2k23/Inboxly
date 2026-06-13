import type { ApiError, ChatRequest, ChatResponse } from "@repo/shared";
import { calendarEvents } from "../lib/calendar-events.js";
import { chatService } from "../services/chat.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const postChat = asyncHandler(async (req, res) => {
  const { messages } = req.body as ChatRequest;
  const userId = req.localUser!.id;

  try {
    const { message, calendarEvents: createdEvents } = await chatService.getCompletion(
      userId,
      messages,
    );
    if (createdEvents.length > 0) {
      calendarEvents.publish(userId, {
        type: "calendar-updated",
        synced: createdEvents.length,
        embedded: createdEvents.length,
      });
    }
    const response: ChatResponse = { message, calendarEvents: createdEvents };
    res.json(response);
  } catch (err) {
    console.error("OpenAI request failed", err);
    const error: ApiError = { error: "Failed to get a response from the AI provider" };
    res.status(502).json(error);
  }
});
