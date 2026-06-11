import type { ChatMessage } from "@repo/shared";
import { env } from "../env.js";
import { openai } from "../lib/openai.js";

export const chatService = {
  async getCompletion(messages: ChatMessage[]): Promise<ChatMessage> {
    const completion = await openai.chat.completions.create({
      model: env.openaiModel,
      messages,
    });

    const choice = completion.choices[0]?.message;
    return { role: "assistant", content: choice?.content ?? "" };
  },
};
