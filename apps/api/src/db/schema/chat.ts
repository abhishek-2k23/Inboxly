import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const chatMessageRoleEnum = pgEnum("chat_message_role", [
  "user",
  "assistant",
  "tool",
  "system",
]);

export type ChatMessageRole = (typeof chatMessageRoleEnum.enumValues)[number];

// Agent chat (Corsair MCP) conversations.
export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => chatConversations.id, { onDelete: "cascade" }),
    role: chatMessageRoleEnum("role").notNull(),
    content: text("content"),
    toolCalls: jsonb("tool_calls"),
    toolResults: jsonb("tool_results"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_chat_messages_conversation_id").on(table.conversationId, table.createdAt)],
);

export type ChatConversation = typeof chatConversations.$inferSelect;
export type NewChatConversation = typeof chatConversations.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
