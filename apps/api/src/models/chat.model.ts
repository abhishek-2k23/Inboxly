import { and, eq } from "drizzle-orm";
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
};
