import type { ApiError, ChatRequest, ChatResponse } from "@repo/shared";
import { chatService } from "../services/chat.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const postChat = asyncHandler(async (req, res) => {
  const { messages } = req.body as ChatRequest;

  try {
    const message = await chatService.getCompletion(messages);
    const response: ChatResponse = { message };
    res.json(response);
  } catch (err) {
    console.error("OpenAI request failed", err);
    const error: ApiError = { error: "Failed to get a response from the AI provider" };
    res.status(502).json(error);
  }
});
