import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
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

  /**
   * Counts how many user-authored messages a conversation already holds - the
   * "depth" of the chat, used to enforce the per-chat message cap before
   * generating another reply.
   */
  async countUserMessages(conversationId: number): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(chatMessages)
      .where(and(eq(chatMessages.conversationId, conversationId), eq(chatMessages.role, "user")));
    return row?.value ?? 0;
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

  /** Returns all conversations for a user, newest first, with their user+assistant messages. */
  async listConversations(userId: number): Promise<
    Array<{
      id: number;
      title: string | null;
      updatedAt: Date;
      messages: Array<{ role: string; content: string }>;
    }>
  > {
    const convs = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.userId, userId))
      .orderBy(desc(chatConversations.updatedAt));

    if (convs.length === 0) return [];

    const allMessages = await db
      .select()
      .from(chatMessages)
      .where(
        and(
          inArray(
            chatMessages.conversationId,
            convs.map((c) => c.id),
          ),
          inArray(chatMessages.role, ["user", "assistant"]),
        ),
      )
      .orderBy(asc(chatMessages.createdAt), asc(chatMessages.id));

    const byConv = new Map<number, typeof allMessages>();
    for (const msg of allMessages) {
      const existing = byConv.get(msg.conversationId) ?? [];
      existing.push(msg);
      byConv.set(msg.conversationId, existing);
    }

    return convs.map((conv) => ({
      id: conv.id,
      title: conv.title,
      updatedAt: conv.updatedAt,
      messages: (byConv.get(conv.id) ?? []).map((m) => ({
        role: m.role,
        content: m.content ?? "",
      })),
    }));
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
