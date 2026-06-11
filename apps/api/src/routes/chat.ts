import { Router } from "express";
import type { ApiError, ChatRequest, ChatResponse } from "@repo/shared";
import { env } from "../env.js";
import { openai } from "../lib/openai.js";

export const chatRouter = Router();

chatRouter.post("/", async (req, res) => {
  const { messages } = req.body as Partial<ChatRequest>;

  if (!Array.isArray(messages) || messages.length === 0) {
    const error: ApiError = { error: "messages must be a non-empty array" };
    res.status(400).json(error);
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: env.openaiModel,
      messages,
    });

    const choice = completion.choices[0]?.message;
    const response: ChatResponse = {
      message: { role: "assistant", content: choice?.content ?? "" },
    };
    res.json(response);
  } catch (err) {
    console.error("OpenAI request failed", err);
    const error: ApiError = { error: "Failed to get a response from the AI provider" };
    res.status(502).json(error);
  }
});
