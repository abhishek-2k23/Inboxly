import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  vector,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const emailPriorityEnum = pgEnum("email_priority", ["high", "medium", "low"]);

// Gmail threads, cached locally for fast list/search views.
export const emailThreads = pgTable(
  "email_threads",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gmailThreadId: text("gmail_thread_id").notNull(),
    subject: text("subject"),
    snippet: text("snippet"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    isUnread: boolean("is_unread").notNull().default(true),
    labels: text("labels").array().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("email_threads_user_thread_unique").on(table.userId, table.gmailThreadId),
    index("idx_email_threads_user_last_message").on(table.userId, table.lastMessageAt.desc()),
  ],
);

// Individual Gmail messages, cached locally for fast list/search/embedding.
export const emails = pgTable(
  "emails",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    threadId: integer("thread_id").references(() => emailThreads.id, { onDelete: "cascade" }),
    gmailMessageId: text("gmail_message_id").notNull(),
    fromAddress: text("from_address").notNull(),
    fromName: text("from_name"),
    toAddresses: jsonb("to_addresses").notNull().default([]),
    ccAddresses: jsonb("cc_addresses").notNull().default([]),
    bccAddresses: jsonb("bcc_addresses").notNull().default([]),
    subject: text("subject"),
    snippet: text("snippet"),
    bodyText: text("body_text"),
    bodyHtml: text("body_html"),
    labels: text("labels").array().notNull().default([]),
    isRead: boolean("is_read").notNull().default(false),
    isStarred: boolean("is_starred").notNull().default(false),
    hasAttachments: boolean("has_attachments").notNull().default(false),
    priority: emailPriorityEnum("priority"),
    priorityReason: text("priority_reason"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("emails_user_message_unique").on(table.userId, table.gmailMessageId),
    index("idx_emails_user_received_at").on(table.userId, table.receivedAt.desc()),
    index("idx_emails_thread_id").on(table.threadId),
  ],
);

export const emailAttachments = pgTable(
  "email_attachments",
  {
    id: serial("id").primaryKey(),
    emailId: integer("email_id")
      .notNull()
      .references(() => emails.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    gmailAttachmentId: text("gmail_attachment_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_email_attachments_email_id").on(table.emailId)],
);

// Embeddings for local semantic search over cached emails.
// vector(1536) matches OpenAI text-embedding-3-small.
export const emailEmbeddings = pgTable(
  "email_embeddings",
  {
    id: serial("id").primaryKey(),
    emailId: integer("email_id")
      .notNull()
      .unique()
      .references(() => emails.id, { onDelete: "cascade" }),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    contentHash: text("content_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_email_embeddings_embedding").using("hnsw", table.embedding.op("vector_cosine_ops")),
  ],
);

export type EmailThread = typeof emailThreads.$inferSelect;
export type NewEmailThread = typeof emailThreads.$inferInsert;
export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
export type EmailAttachment = typeof emailAttachments.$inferSelect;
export type NewEmailAttachment = typeof emailAttachments.$inferInsert;
export type EmailEmbedding = typeof emailEmbeddings.$inferSelect;
export type NewEmailEmbedding = typeof emailEmbeddings.$inferInsert;
