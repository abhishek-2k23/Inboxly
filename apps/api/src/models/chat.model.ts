import { and, asc, eq } from "drizzle-orm";
import type OpenAI from "openai";
import { db } from "../db/client.js";
import { chatConversations, chatMessages, type ChatMessageRole } from "../db/schema/index.js";

export const chatModel = {
  async getOrCreateConversation(
    userId: number,
    conversationId: number | undefined,
    title: string | null,
  ): Promise<number> {
    if (conversationId !== undefined) {
      const [existing] = await db
        .select({ id: chatConversations.id })
        .from(chatConversations)
        .where(and(eq(chatConversations.id, conversationId), eq(chatConversations.userId, userId)));
      if (existing) return existing.id;
    }

    const [created] = await db.insert(chatConversations).values({ userId, title }).returning();
    return created!.id;
  },

  async addMessage(
    conversationId: number,
    role: ChatMessageRole,
    content: string | null,
    options: { toolCalls?: unknown; toolResults?: unknown } = {},
  ): Promise<void> {
    await db.insert(chatMessages).values({
      conversationId,
      role,
      content,
      toolCalls: options.toolCalls ?? null,
      toolResults: options.toolResults ?? null,
    });

    await db
      .update(chatConversations)
      .set({ updatedAt: new Date() })
      .where(eq(chatConversations.id, conversationId));
  },

  /** Loads a conversation's full message history as OpenAI chat messages, including past tool calls/results. */
  async getConversationMessages(
    conversationId: number,
  ): Promise<OpenAI.ChatCompletionMessageParam[]> {
    const rows = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(asc(chatMessages.createdAt), asc(chatMessages.id));

    return rows.map((row) => {
      if (row.role === "tool") {
        const toolResults = row.toolResults as { toolCallId?: string } | null;
        return {
          role: "tool",
          tool_call_id: toolResults?.toolCallId ?? "",
          content: row.content ?? "",
        } satisfies OpenAI.ChatCompletionMessageParam;
      }

      if (row.role === "assistant" && row.toolCalls) {
        return {
          role: "assistant",
          content: row.content,
          tool_calls: row.toolCalls as OpenAI.ChatCompletionMessageToolCall[],
        } satisfies OpenAI.ChatCompletionMessageParam;
      }

      return {
        role: row.role,
        content: row.content ?? "",
      } as OpenAI.ChatCompletionMessageParam;
    });
  },
};
