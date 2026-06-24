import type {
  CalendarEventDateTime,
  CalendarEventSummary,
  ChatMessage,
  EmailAttachment,
  EmailRef,
} from "@repo/shared";
import type OpenAI from "openai";
import { env } from "../env.js";
import { openai } from "../lib/openai.js";
import { chatModel } from "../models/chat.model.js";
import { PlanLimitError } from "./account.service.js";
import { calendarService } from "./calendar.service.js";
import { emailService } from "./email.service.js";

const CHAT_TOOLS: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "create_calendar_event",
      description:
        "Create a new event on the user's primary Google Calendar. Use this whenever the user asks to schedule, book, or add a meeting, appointment, or reminder.",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description:
              "Short title of the event. If the user didn't give one explicitly, create a concise, descriptive title based on what the event is about.",
          },
          description: {
            type: "string",
            description: "Longer description or notes for the event.",
          },
          location: { type: "string", description: "Location of the event." },
          start: {
            type: "string",
            description:
              "Start of the event as a local date-time without a UTC offset (e.g. 2026-06-15T14:00:00), resolved against the user's current local date/time given below. For all-day events, a date (YYYY-MM-DD).",
          },
          end: {
            type: "string",
            description:
              "End of the event, in the same format as `start` (both must be a plain date, or both a local date-time).",
          },
          timeZone: {
            type: "string",
            description:
              "IANA timezone for `start`/`end`, e.g. America/Los_Angeles. Defaults to the user's current timezone given below if omitted.",
          },
          attendees: {
            type: "array",
            description: "Email addresses of people to invite.",
            items: {
              type: "object",
              properties: {
                email: { type: "string", description: "Attendee email address." },
              },
              required: ["email"],
            },
          },
          addMeetLink: {
            type: "boolean",
            description:
              "Set to true to attach a Google Meet video call to the event. Use this when the user " +
              "asks for a video call, Meet link, virtual meeting, or to 'send a meet invite'.",
          },
        },
        required: ["summary", "start", "end"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_calendar_events",
      description:
        "Look up events on the user's Google Calendar. Use this whenever the user asks about their schedule, " +
        "upcoming meetings, availability, free time, or to find a specific event (e.g. 'what's on my calendar this week?', " +
        "'do I have anything tomorrow?', 'when is my dentist appointment?', 'am I free Friday afternoon?', " +
        "'find my free slots this week', 'when am I available next month?'). " +
        "For free-schedule/availability queries: fetch all events in the requested range with a high limit (25-50), " +
        "then identify gaps between events during working hours (default 9am–6pm) as free slots.",
      parameters: {
        type: "object",
        properties: {
          timeMin: {
            type: "string",
            description:
              "Start of the date range as a local date-time without a UTC offset (e.g. 2026-06-15T00:00:00), " +
              "resolved against the user's current local date/time given below. Defaults to right now if omitted - " +
              "set it explicitly (e.g. to the start of today) to include events earlier today.",
          },
          timeMax: {
            type: "string",
            description:
              "End of the date range, in the same format as `timeMin`. Omit for no upper bound (e.g. 'upcoming events'). " +
              "For free-schedule queries always set this to the end of the requested range.",
          },
          query: {
            type: "string",
            description:
              "Free-text search against the event title, description, location, or attendees, e.g. 'dentist' or 'standup'. Optional - omit when fetching all events for availability analysis.",
          },
          limit: {
            type: "number",
            description:
              "Maximum number of events to return (default 10, max 50). Use 25-50 for free-schedule/availability analysis so no events are missed.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_emails",
      description:
        "Look up emails from the user's synced inbox. Use this whenever the user asks you to find, look up, summarize, " +
        "or reply to an email - call it first to load the email's content before summarizing or replying. " +
        "Use mode='recent' (with no query needed) for requests like 'the latest email', 'my newest emails', or " +
        "'the most recent email from X' - this returns emails sorted by date, newest first. " +
        "Use mode='search' with a query for requests about a topic, e.g. 'the invoice from Acme' or 'the email about the roadmap'. " +
        "For analytical tasks that scan across many emails (expenses, deliveries, orders, receipts), set limit to 15-20 " +
        "and use a broad relevant query so you have enough data to calculate totals or find patterns.",
      parameters: {
        type: "object",
        properties: {
          mode: {
            type: "string",
            enum: ["recent", "search"],
            description:
              "'recent' returns the newest emails by date (optionally filtered by `query` against sender/subject/snippet). " +
              "'search' finds emails semantically matching `query`. Defaults to 'search' if `query` is given, otherwise 'recent'.",
          },
          query: {
            type: "string",
            description:
              "A natural-language description of the email(s) to find, e.g. 'invoice from Acme' or 'email from Priya about the roadmap'. " +
              "For expense queries use terms like 'invoice payment receipt bill amount'. " +
              "For delivery queries use terms like 'shipped delivery tracking order dispatch'. Optional when mode='recent'.",
          },
          limit: {
            type: "number",
            description:
              "Maximum number of matching emails to return (default 5, max 20). Use 15-20 for analytical/aggregation tasks.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_email",
      description:
        "Send an email immediately via Gmail (this is a real send, not a draft). Use this when the user asks you to " +
        "reply to, send, or write an email. To reply to a specific email you previously found with search_emails, " +
        "pass its `id` as `replyToEmailId` - the recipient, subject ('Re: ...'), and thread are filled in automatically " +
        "from the original email. For a brand-new email, provide `to` and `subject` explicitly. " +
        "Any files the user attached to their message are included automatically - you do not pass attachments yourself.",
      parameters: {
        type: "object",
        properties: {
          body: {
            type: "string",
            description:
              "The email/reply body, written in Markdown (a greeting, short paragraphs separated " +
              "by blank lines, and bullet lists where helpful) so it renders as clean HTML in Gmail. " +
              "Match the tone, formality, and topic the user asked for. Sign off with the sender's " +
              "real name given in the system prompt - NEVER a placeholder like '[Your Name]'. Do not " +
              "include the subject line in the body or wrap it in code fences.",
          },
          replyToEmailId: {
            type: "string",
            description:
              "The `id` of the email being replied to, from a previous search_emails result.",
          },
          to: {
            type: "string",
            description:
              "Recipient email address. Required for a new email if not replying to an existing one.",
          },
          subject: {
            type: "string",
            description:
              "Subject line. If omitted when replying, defaults to 'Re: <original subject>'.",
          },
        },
        required: ["body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_draft",
      description:
        "Save an email as a Gmail draft WITHOUT sending it, so the user can review or edit it before it goes out. " +
        "Use this when the user asks you to 'draft', 'write a draft', 'prepare', or 'save a draft' of an email rather " +
        "than send it - or when you are unsure whether they want it sent and want to be safe. Same arguments as " +
        "send_email: pass `replyToEmailId` to draft a reply to an email found with search_emails (recipient/subject/" +
        "thread are filled in automatically), or `to`/`subject` for a brand-new draft. Any files the user attached to " +
        "their message are included automatically.",
      parameters: {
        type: "object",
        properties: {
          body: {
            type: "string",
            description:
              "The draft email/reply body, written in Markdown, exactly as for send_email. Sign off with the sender's " +
              "real name - NEVER a placeholder like '[Your Name]'.",
          },
          replyToEmailId: {
            type: "string",
            description:
              "The `id` of the email being replied to, from a previous search_emails result.",
          },
          to: {
            type: "string",
            description:
              "Recipient email address. Required for a new draft if not replying to an existing email.",
          },
          subject: {
            type: "string",
            description:
              "Subject line. If omitted when replying, defaults to 'Re: <original subject>'.",
          },
        },
        required: ["body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "archive_email",
      description:
        "Archive an email - remove it from the inbox (it stays searchable, this does NOT delete it). Use this when the " +
        "user asks to archive, file away, or 'remove from inbox' an email. Pass the `id` of the email, which you get " +
        "from a previous search_emails result; call search_emails first if you don't have it yet.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The `id` of the email to archive, from a previous search_emails result.",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_calendar_event",
      description:
        "Modify an existing event on the user's Google Calendar - change its time, title, location, description, or " +
        "attendees (e.g. 'move my 3pm to 4pm', 'rename the standup', 'add jane@example.com to the kickoff'). First call " +
        "search_calendar_events to find the event and get its `id`, then call this with that `id` and the fields to " +
        "change. Provide ALL fields you want the event to keep - omitted fields may be cleared - so carry over the " +
        "existing summary/start/end unless you are changing them.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description:
              "The `id` of the event to update, from a previous search_calendar_events result.",
          },
          summary: { type: "string", description: "Event title." },
          description: {
            type: "string",
            description: "Longer description or notes for the event.",
          },
          location: { type: "string", description: "Location of the event." },
          start: {
            type: "string",
            description:
              "Start as a local date-time without a UTC offset (e.g. 2026-06-15T14:00:00), resolved against the user's " +
              "current local date/time. For all-day events, a date (YYYY-MM-DD).",
          },
          end: {
            type: "string",
            description:
              "End of the event, in the same format as `start` (both plain dates, or both local date-times).",
          },
          timeZone: {
            type: "string",
            description:
              "IANA timezone for `start`/`end`. Defaults to the user's current timezone if omitted.",
          },
          attendees: {
            type: "array",
            description:
              "Email addresses of people to invite (replaces the existing attendee list).",
            items: {
              type: "object",
              properties: { email: { type: "string", description: "Attendee email address." } },
              required: ["email"],
            },
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_calendar_event",
      description:
        "Delete (cancel) an event from the user's Google Calendar. Use this when the user asks to cancel, remove, or " +
        "delete an event. First call search_calendar_events to find the event and get its `id`. Because this is " +
        "destructive, only call it once the user has clearly identified the specific event to delete - if more than one " +
        "event could match, ask them which one first.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description:
              "The `id` of the event to delete, from a previous search_calendar_events result.",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cite_emails",
      description:
        "Record exactly which email IDs you actually used or quoted in your final response — " +
        "table rows, summaries, drafts, or any other direct reference. " +
        "Call this as your LAST tool call, immediately before writing your reply. " +
        "Only include emails whose content directly appears in your answer; do NOT include emails " +
        "you fetched but skipped (e.g. no clear amount, irrelevant content, or duplicates).",
      parameters: {
        type: "object",
        properties: {
          emailIds: {
            type: "array",
            items: { type: "string" },
            description:
              "The exact `id` values of emails whose data appears in your response. " +
              "Match these to the `id` field from search_emails results.",
          },
        },
        required: ["emailIds"],
      },
    },
  },
];

interface CreateCalendarEventArgs {
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  timeZone?: string;
  attendees?: { email: string }[];
  addMeetLink?: boolean;
}

const ALL_DAY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Caps how many rounds of tool calls a single completion can make. Set to 7 to support multi-step analytical tasks. */
const MAX_TOOL_ITERATIONS = 7;

function toEventDateTime(value: string, timeZone?: string): CalendarEventDateTime {
  if (ALL_DAY_DATE_PATTERN.test(value)) {
    return { date: value };
  }
  return { dateTime: value, timeZone };
}

/** Formats "now" as a local YYYY-MM-DDTHH:mm:ss string in the given IANA timezone (UTC if omitted). */
function formatLocalDateTime(timeZone?: string): string {
  const now = new Date();
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: timeZone ?? "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);

    const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${lookup.year}-${lookup.month}-${lookup.day}T${lookup.hour}:${lookup.minute}:${lookup.second}`;
  } catch {
    return now.toISOString();
  }
}

/** Converts a local "YYYY-MM-DDTHH:mm:ss" date-time in the given IANA timezone to a UTC ISO string. */
function localDateTimeToUtcISOString(localDateTime: string, timeZone?: string): string {
  const asUTC = new Date(`${localDateTime}Z`);
  if (Number.isNaN(asUTC.getTime())) return localDateTime;
  if (!timeZone) return asUTC.toISOString();

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(asUTC);

    const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const asIfUTC = Date.UTC(
      Number(lookup.year),
      Number(lookup.month) - 1,
      Number(lookup.day),
      Number(lookup.hour),
      Number(lookup.minute),
      Number(lookup.second),
    );
    const offsetMs = asIfUTC - asUTC.getTime();
    return new Date(asUTC.getTime() - offsetMs).toISOString();
  } catch {
    return asUTC.toISOString();
  }
}

/** Derives a fallback event title from the most recent user message when the model doesn't supply one. */
function deriveFallbackSummary(messages: ChatMessage[]): string {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
  const text = lastUserMessage?.content.trim() ?? "";
  if (!text) return "New event";
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
}

interface Sender {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}

/**
 * The name to sign emails with. Prefers the user's real first/last name; falls
 * back to a title-cased version of their email local part (e.g. "john.doe" ->
 * "John Doe") so the model never has to guess or leave a "[Your Name]" placeholder.
 */
function deriveSenderName(sender: Sender): string {
  const full = [sender.firstName, sender.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;

  const local = sender.email.split("@")[0] ?? "";
  const pretty = local
    .replace(/[._-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return pretty || sender.email;
}

/** Derives a conversation title from the first user message, for new conversations. */
function deriveConversationTitle(messages: ChatMessage[]): string | null {
  const firstUserMessage = messages.find((message) => message.role === "user");
  const text = firstUserMessage?.content.trim();
  if (!text) return null;
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

async function runCreateCalendarEvent(
  userId: number,
  toolCall: OpenAI.ChatCompletionMessageToolCall,
  context: { defaultTimeZone?: string; fallbackSummary: string },
): Promise<{ result: unknown; event: CalendarEventSummary | null }> {
  try {
    const args = JSON.parse(toolCall.function.arguments) as CreateCalendarEventArgs;
    const timeZone = args.timeZone ?? context.defaultTimeZone;
    const summary = args.summary?.trim() || context.fallbackSummary;

    const extracted = {
      summary,
      description: args.description,
      location: args.location,
      start: toEventDateTime(args.start, timeZone),
      end: toEventDateTime(args.end, timeZone),
      attendees: args.attendees,
      addMeetLink: args.addMeetLink,
    };

    const event = await calendarService.createEvent(userId, extracted);
    return { result: { success: true, event }, event };
  } catch (error) {
    return {
      result: {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create the event",
      },
      event: null,
    };
  }
}

const DEFAULT_CALENDAR_SEARCH_LIMIT = 10;
const MAX_CALENDAR_SEARCH_LIMIT = 50;

interface SearchCalendarEventsArgs {
  timeMin?: string;
  timeMax?: string;
  query?: string;
  limit?: number;
}

async function runSearchCalendarEvents(
  userId: number,
  toolCall: OpenAI.ChatCompletionMessageToolCall,
  context: { defaultTimeZone?: string },
): Promise<unknown> {
  try {
    const args = JSON.parse(toolCall.function.arguments) as SearchCalendarEventsArgs;
    const limit = Math.min(
      Math.max(args.limit ?? DEFAULT_CALENDAR_SEARCH_LIMIT, 1),
      MAX_CALENDAR_SEARCH_LIMIT,
    );
    const timeZone = context.defaultTimeZone;

    const events = await calendarService.listEventsInRange(userId, {
      timeMin: args.timeMin ? localDateTimeToUtcISOString(args.timeMin, timeZone) : undefined,
      timeMax: args.timeMax ? localDateTimeToUtcISOString(args.timeMax, timeZone) : undefined,
      query: args.query?.trim() || undefined,
      limit,
    });

    return { success: true, events };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search calendar events",
    };
  }
}

const DEFAULT_EMAIL_SEARCH_LIMIT = 5;
const MAX_EMAIL_SEARCH_LIMIT = 20;
const EMAIL_BODY_PREVIEW_LENGTH = 4000;

interface SearchEmailsArgs {
  mode?: "recent" | "search";
  query?: string;
  limit?: number;
}

async function runSearchEmails(
  userId: number,
  toolCall: OpenAI.ChatCompletionMessageToolCall,
): Promise<unknown> {
  try {
    const args = JSON.parse(toolCall.function.arguments) as SearchEmailsArgs;
    const limit = Math.min(
      Math.max(args.limit ?? DEFAULT_EMAIL_SEARCH_LIMIT, 1),
      MAX_EMAIL_SEARCH_LIMIT,
    );
    const query = args.query?.trim();
    const mode = args.mode ?? (query ? "search" : "recent");

    const results =
      mode === "recent"
        ? await emailService.listRecentFromInbox(userId, limit)
        : await emailService.searchInbox(userId, query ?? "", limit);

    return {
      success: true,
      emails: results.map((email) => ({
        id: email.id,
        threadId: email.threadId,
        subject: email.subject,
        from: email.from,
        to: email.to,
        snippet: email.snippet,
        body: email.body?.slice(0, EMAIL_BODY_PREVIEW_LENGTH),
        internalDate: email.internalDate,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search emails",
    };
  }
}

interface SendEmailArgs {
  body: string;
  replyToEmailId?: string;
  to?: string;
  subject?: string;
}

async function runSendEmail(
  userId: number,
  toolCall: OpenAI.ChatCompletionMessageToolCall,
  context: { attachments?: EmailAttachment[]; maxBytesPerFile?: number },
): Promise<unknown> {
  try {
    const args = JSON.parse(toolCall.function.arguments) as SendEmailArgs;
    const sent = await emailService.sendEmail(userId, {
      to: args.to,
      subject: args.subject,
      body: args.body,
      replyToEmailId: args.replyToEmailId,
      // Files the user attached in the prompt box ride along here; the model
      // never carries the bytes, so we inject them at send time.
      attachments: context.attachments,
      maxBytesPerFile: context.maxBytesPerFile,
    });
    return { success: true, sent };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send the email",
    };
  }
}

interface CreateDraftArgs {
  body: string;
  replyToEmailId?: string;
  to?: string;
  subject?: string;
}

async function runCreateDraft(
  userId: number,
  toolCall: OpenAI.ChatCompletionMessageToolCall,
  context: { attachments?: EmailAttachment[]; maxBytesPerFile?: number },
): Promise<unknown> {
  try {
    const args = JSON.parse(toolCall.function.arguments) as CreateDraftArgs;
    const draft = await emailService.createDraft(userId, {
      to: args.to,
      subject: args.subject,
      body: args.body,
      replyToEmailId: args.replyToEmailId,
      attachments: context.attachments,
      maxBytesPerFile: context.maxBytesPerFile,
    });
    return { success: true, draft };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create the draft",
    };
  }
}

interface ArchiveEmailArgs {
  id: string;
}

async function runArchiveEmail(
  userId: number,
  toolCall: OpenAI.ChatCompletionMessageToolCall,
): Promise<unknown> {
  try {
    const args = JSON.parse(toolCall.function.arguments) as ArchiveEmailArgs;
    const archived = await emailService.archiveEmail(userId, args.id);
    if (!archived) {
      return { success: false, error: "Email not found." };
    }
    return { success: true, email: { id: archived.id, subject: archived.subject } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to archive the email",
    };
  }
}

interface UpdateCalendarEventArgs {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: string;
  end?: string;
  timeZone?: string;
  attendees?: { email: string }[];
}

async function runUpdateCalendarEvent(
  userId: number,
  toolCall: OpenAI.ChatCompletionMessageToolCall,
  context: { defaultTimeZone?: string },
): Promise<{ result: unknown; event: CalendarEventSummary | null }> {
  try {
    const args = JSON.parse(toolCall.function.arguments) as UpdateCalendarEventArgs;
    const timeZone = args.timeZone ?? context.defaultTimeZone;

    // Google Calendar's update is a full replace - omitted fields get cleared.
    // Load the current event and merge the model's changes over it so the user
    // only has to specify what's changing (e.g. just a new title).
    const existing = await calendarService.getEvent(userId, args.id);
    if (!existing) {
      return { result: { success: false, error: "Event not found." }, event: null };
    }

    const updated = await calendarService.updateEvent(userId, args.id, {
      summary: args.summary ?? existing.summary ?? "",
      description: args.description ?? existing.description,
      location: args.location ?? existing.location,
      start: args.start ? toEventDateTime(args.start, timeZone) : existing.start,
      end: args.end ? toEventDateTime(args.end, timeZone) : existing.end,
      attendees: args.attendees ?? existing.attendees,
    });

    if (!updated) {
      return { result: { success: false, error: "Event not found." }, event: null };
    }
    return { result: { success: true, event: updated }, event: updated };
  } catch (error) {
    return {
      result: {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update the event",
      },
      event: null,
    };
  }
}

interface DeleteCalendarEventArgs {
  id: string;
}

async function runDeleteCalendarEvent(
  userId: number,
  toolCall: OpenAI.ChatCompletionMessageToolCall,
): Promise<{ result: unknown; deleted: boolean }> {
  try {
    const args = JSON.parse(toolCall.function.arguments) as DeleteCalendarEventArgs;
    const deleted = await calendarService.deleteEvent(userId, args.id);
    if (!deleted) {
      return { result: { success: false, error: "Event not found." }, deleted: false };
    }
    return { result: { success: true }, deleted: true };
  } catch (error) {
    return {
      result: {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete the event",
      },
      deleted: false,
    };
  }
}

export interface ChatCompletionResult {
  message: ChatMessage;
  calendarEvents: CalendarEventSummary[];
  conversationId: number;
  /** True when send_email succeeded on this turn. */
  emailSent: boolean;
  /** True when any calendar event was created, updated, or deleted this turn (so the UI can refresh). */
  calendarChanged: boolean;
  /** Unique emails fetched via search_emails this turn — surfaced as source links in the chat UI. */
  referencedEmails: EmailRef[];
}

export const chatService = {
  async getCompletion(
    userId: number,
    messages: ChatMessage[],
    options: {
      sender: Sender;
      timeZone?: string;
      conversationId?: number;
      attachments?: EmailAttachment[];
      maxBytesPerFile?: number;
      /** Max user messages allowed per chat (-1 = unlimited). Enforced before generating a reply. */
      chatDepthLimit?: number;
    },
  ): Promise<ChatCompletionResult> {
    const { sender, timeZone, conversationId, attachments, maxBytesPerFile, chatDepthLimit } =
      options;
    const conversationIdToUse = await chatModel.getOrCreateConversation(
      userId,
      conversationId,
      conversationId === undefined ? deriveConversationTitle(messages) : null,
    );

    // Enforce the per-chat message cap ("chat depth") before doing any work, so
    // a maxed-out chat doesn't spend an AI call. A brand-new chat has 0 prior
    // user messages, so this only ever bites follow-ups in an existing chat.
    if (chatDepthLimit !== undefined && chatDepthLimit >= 0) {
      const priorUserMessages = await chatModel.countUserMessages(conversationIdToUse);
      if (priorUserMessages >= chatDepthLimit) {
        throw new PlanLimitError("chatDepth");
      }
    }

    const latestMessage = messages[messages.length - 1];
    if (latestMessage) {
      await chatModel.addMessage(conversationIdToUse, latestMessage.role, latestMessage.content);
    }

    const localNow = formatLocalDateTime(timeZone);
    const timeZoneLabel = timeZone ?? "UTC";
    const senderName = deriveSenderName(sender);
    const attachmentsNote =
      attachments && attachments.length > 0
        ? `The user attached ${attachments.length} file(s) to this message: ` +
          `${attachments.map((a) => a.filename).join(", ")}. These will be included automatically ` +
          `when you call send_email - you do NOT pass them yourself. If the user wants the file(s) sent, ` +
          `call send_email and mention in your reply that the attachment(s) were included. `
        : "";

    const systemMessage: OpenAI.ChatCompletionMessageParam = {
      role: "system",
      content:
        `You are Inboxly, an intelligent assistant embedded in an email and calendar app. ` +
        `You help the user get real work done with their Gmail inbox and Google Calendar — not just simple lookups, ` +
        `but analytical tasks like tallying expenses across multiple emails, tracking deliveries, finding free schedule ` +
        `slots, and answering any question that can be answered by reading their emails or calendar. ` +
        `If the user asks something genuinely unrelated to their email or calendar (e.g. general coding help, trivia), ` +
        `politely let them know you're focused on email and calendar, and offer to help with something related. ` +
        `\n\n` +
        `═══ RESPONSE STYLE ═══\n` +
        `BREVITY — lead with the answer immediately. Zero preamble ("Sure!", "Of course!", "Great question!"). ` +
        `No emojis — never use emoji characters anywhere in replies. ` +
        `Zero trailing filler ("Let me know if you need anything else!"). Every sentence must earn its place. ` +
        `Simple questions get 1–3 lines. Complex results get sections — still kept tight.\n` +
        `\n` +
        `STRUCTURE — for multi-item replies:\n` +
        `• **Bold** every key data point: names, amounts, dates, event titles.\n` +
        `• Numbered lists for ordered/ranked results. Bullet lists for unordered items. Max 6 items per list — use a table if more.\n` +
        `• Markdown tables for structured data (expenses, deliveries, schedules).\n` +
        `• Group by day or category with a **bold header line**, not one long flat list.\n` +
        `• End financial summaries with a **Total: ₹X,XXX** line on its own.\n` +
        `\n` +
        `CALLOUTS — use blockquote callouts for status so they render in colour. ` +
        `Never use emojis anywhere in your replies. Use these exact text prefixes:\n` +
        `• \`> Done: ...\` — success, sent, confirmed, completed\n` +
        `• \`> Error: ...\` — failure, not found, something went wrong\n` +
        `• \`> Warning: ...\` — overdue, deadline, caution, attention needed\n` +
        `• \`> Note: ...\` — tip, suggestion, insight, follow-up action\n` +
        `\n` +
        `Examples:\n` +
        `> Done: Email sent to priya@example.com\n` +
        `> Error: No matching emails found for "dentist appointment"\n` +
        `> Warning: Invoice from Acme (₹12,400) is due in 3 days — Jun 28\n` +
        `> Note: Friday is your most open day — want me to book something?\n` +
        `\n\n` +
        `═══ ASKING WHEN INFORMATION IS MISSING ═══\n` +
        `If you need a detail to complete a task and it isn't in the conversation, ask the user a brief, specific ` +
        `question instead of guessing. For example: ask for the recipient if sending a new email and you don't know who to, ` +
        `the date/time if scheduling and it wasn't given, or which event they mean if your search returns several matches. ` +
        `Never fabricate an email address, date, or recipient. ` +
        `\n\n` +
        `═══ CONFIRMING DESTRUCTIVE ACTIONS ═══\n` +
        `Before calling send_email or delete_calendar_event, confirm with the user OR default to the safe option ` +
        `(create_draft instead of send_email) unless they clearly asked to send/delete right now. ` +
        `Read-only actions (search, summarize, calculate, check availability) — just do them immediately without confirming. ` +
        `\n\n` +
        `═══ EMAIL TASKS ═══\n` +
        `Call search_emails before any task that needs email content. Always include sender and subject in your reply ` +
        `so the user knows which email(s) you're working with. Remember the \`id\` of fetched emails — reuse it in ` +
        `follow-ups when the user says "that email" or "it". ` +
        `• Summarising: Use mode='recent' for "latest N emails"; use mode='search' with a topic query for everything else. ` +
        `  Present each email as a numbered item: **1. Subject** — From: Sender — _one-sentence summary_. ` +
        `• Replying/sending: call send_email (sends immediately) or create_draft (saves to Drafts). Pass \`replyToEmailId\` ` +
        `  to thread replies correctly. After sending, confirm it in your reply. ` +
        `• Archiving: call archive_email with the email's \`id\`. ` +
        `\n` +
        `ANALYTICAL EMAIL TASKS — handle these by fetching emails, reading their bodies, then reasoning over the data:\n` +
        `\n` +
        `• Expenses / payments / invoices: ` +
        `  Search with mode='search', query='invoice payment receipt bill amount paid order credited debited transaction spent purchase debit credit', limit=20. ` +
        `  Scan each email body for monetary amounts (₹, $, €, Rs, INR, USD, etc.) using context to decide if it's ` +
        `  a real charge or credit to the user — include bank debits, UPI payments, order confirmations, subscriptions, and recharges. ` +
        `  Skip promotional/marketing emails that mention prices but aren't actual charges. ` +
        `  Build a Markdown table (Date | Sender | Description | Amount). ` +
        `  Sum all amounts and show **Total: X**. If amounts are in mixed currencies, group by currency. ` +
        `  After building your response, call cite_emails with the IDs of only the emails that appear in your table. ` +
        `\n` +
        `• Deliveries / shipments / orders: ` +
        `  Search with mode='search', query='shipped delivery tracking order dispatch courier out for delivery estimated arrival', limit=15. ` +
        `  Extract: item ordered, courier/seller name, expected delivery date, tracking number (if present). ` +
        `  Sort results by expected delivery date. Present as a numbered list with **bold** delivery dates. ` +
        `  Flag any that are overdue (delivery date before today: ${localNow.slice(0, 10)}). ` +
        `  After building your response, call cite_emails with the IDs of only the emails that appear in your list. ` +
        `\n` +
        `• Any other aggregation (e.g. "how many emails from X this month", "list all meeting invites"): ` +
        `  Fetch with a relevant query, count/group/filter the results, and present the answer with supporting detail. ` +
        `  Always call cite_emails with the IDs of emails you actually cited in your response. ` +
        `\n\n` +
        `═══ CALENDAR TASKS ═══\n` +
        `The user's current local date and time is **${localNow}** in the **${timeZoneLabel}** timezone. ` +
        `Resolve all relative dates ("tomorrow", "next Monday", "this week", "end of month") against this. ` +
        `\n` +
        `• Viewing schedule: call search_calendar_events and present events as a list grouped by day:\n` +
        `  **Mon Jun 23**\n` +
        `  • 10:00–11:00 — Team Standup (Google Meet)\n` +
        `  • 14:00–15:00 — 1:1 with Manager\n` +
        `  Include location or Meet link when present. If no events, say the calendar is clear for that period. ` +
        `\n` +
        `• Creating events: call create_calendar_event. Express start/end as local date-time without UTC offset ` +
        `  (e.g. 2026-06-15T15:00:00) and set timeZone to "${timeZoneLabel}" unless the user asks otherwise. ` +
        `  Both start and end must use the same format (both plain date OR both date-time). ` +
        `  If today or earlier-today is in scope, set timeMin to start of that day. ` +
        `\n` +
        `• Rescheduling: find the event with search_calendar_events, then call update_calendar_event with its \`id\` ` +
        `  and only the changed fields — the rest are preserved automatically. ` +
        `\n` +
        `• Deleting: find the event, then call delete_calendar_event; if multiple events match, ask the user which one. ` +
        `\n` +
        `FREE SCHEDULE / AVAILABILITY — step-by-step:\n` +
        `1. Call search_calendar_events with timeMin=start of requested range, timeMax=end of range, limit=50 (no query). ` +
        `2. Sort the returned events by start time. ` +
        `3. For each day in the range, identify gaps ≥ 30 minutes between events during working hours ` +
        `   (default 09:00–18:00 unless the user specifies different hours). ` +
        `4. Present as a structured list:\n` +
        `   **Mon Jun 23** — 3 free slots\n` +
        `   • 09:00–10:00 (1 h)\n` +
        `   • 12:00–14:00 (2 h)\n` +
        `   • 16:30–18:00 (1.5 h)\n` +
        `5. If the user then asks to schedule something, pick the earliest suitable free slot and call create_calendar_event. ` +
        `\n\n` +
        `═══ TOOL ERRORS & RETRIES ═══\n` +
        `Every tool returns success: true with a result, or success: false with an error message. ` +
        `On failure, tell the user what went wrong (quote the error) and suggest how to fix it. ` +
        `A failure on a previous turn never blocks a retry — treat the user's next message as a fresh attempt ` +
        `using all context from the conversation. ` +
        `\n\n` +
        `═══ WRITING EMAILS ═══\n` +
        `You write on behalf of **${senderName}** <${sender.email}>. ` +
        `Always sign off with "${senderName}" — NEVER a placeholder like "[Your Name]". ` +
        `Match the tone the user asked for. Write in Markdown (greeting, short paragraphs, bullets where helpful). ` +
        `Do not include the subject line inside the body. Do not wrap the body in code fences. ` +
        attachmentsNote,
    };

    const history = await chatModel.getConversationMessages(conversationIdToUse);

    // Few-shot examples injected after the system prompt on every turn.
    // They are NOT persisted to the DB — they only exist in the in-memory
    // conversation array so the model always sees the expected response style
    // without the examples inflating stored history or token counts on retries.
    const fewShotExamples: OpenAI.ChatCompletionMessageParam[] = [
      // ── Example 1: email summary (numbered list, bold key data, action prompt)
      {
        role: "user",
        content: "Summarize my last 5 emails",
      },
      {
        role: "assistant",
        content:
          "**5 most recent emails:**\n\n" +
          "1. **Re: Q3 Budget Review** — **Sarah Chen** — _Approved forecast; needs your sign-off by Friday._\n" +
          "2. **Invoice #INV-2047** — **Acme Corp** — _₹12,400 due in 14 days (hosting)._\n" +
          "3. **Your order has shipped!** — **Amazon** — _iPhone case · Blue Dart · arriving Jun 27._\n" +
          "4. **Standup Notes** — **Rohan Mehta** — _3 action items tagged to you._\n" +
          "5. **Coffee chat?** — **Priya Nair** — _Wants to meet this Thursday, 30 min._\n\n" +
          "> Warning: #2 has a payment deadline — want me to set a reminder?\n\n" +
          "Reply, archive, or forward any of these?",
      },

      // ── Example 2: expense calculation (table + total + warning callout)
      {
        role: "user",
        content: "Find all invoice and payment emails and calculate the total",
      },
      {
        role: "assistant",
        content:
          "**5 payment emails found:**\n\n" +
          "| Date | From | Description | Amount |\n" +
          "|------|------|-------------|--------|\n" +
          "| Jun 18 | Acme Corp | Invoice #INV-2047 — Hosting | ₹12,400 |\n" +
          "| Jun 12 | Notion | Monthly Pro | ₹800 |\n" +
          "| Jun 10 | AWS | Cloud usage — May | ₹4,230 |\n" +
          "| Jun 5 | Figma | Team plan renewal | ₹2,100 |\n" +
          "| May 28 | Razorpay | Gateway fee | ₹340 |\n\n" +
          "**Total: ₹19,870**\n\n" +
          "> Warning: Acme Corp invoice (₹12,400) is due in **14 days** — Jun 30.\n\n" +
          "> Note: Want a calendar reminder or a payment-confirmation draft?",
      },

      // ── Example 3: free schedule (day-grouped slots + info callout)
      {
        role: "user",
        content: "Find my free schedule this week",
      },
      {
        role: "assistant",
        content:
          "**Free slots this week (9 am – 6 pm):**\n\n" +
          "**Mon Jun 23** · 09:00–10:30 _(1.5 h)_ · 14:00–16:00 _(2 h)_\n" +
          "**Tue Jun 24** · 09:00–11:00 _(2 h)_ · 15:30–18:00 _(2.5 h)_\n" +
          "**Wed Jun 25** · 12:00–13:00 _(1 h — mostly booked)_\n" +
          "**Thu Jun 26** · 09:00–10:00 _(1 h)_ · 14:00–16:30 _(2.5 h)_\n" +
          "**Fri Jun 27** · 09:00–12:00 _(3 h)_ · 14:30–18:00 _(3.5 h)_\n\n" +
          "> Note: Friday is your most open day. Want me to schedule something?",
      },

      // ── Example 4: deliveries (numbered list + success/warning callouts)
      {
        role: "user",
        content: "Find my upcoming deliveries this month",
      },
      {
        role: "assistant",
        content:
          "**3 upcoming deliveries:**\n\n" +
          "1. **iPhone 15 Case** — Amazon · **Jun 27** · Blue Dart TRK 4921837465\n" +
          "2. **Keychron K2 Keyboard** — Flipkart · **Jun 28** · Ekart #FK-9183746\n" +
          "3. **Protein Powder 2 kg** — Healthkart · **Jun 30** · Delhivery #HK-298371\n\n" +
          "> Done: All on track — no overdue deliveries.\n\n" +
          "> Note: Add delivery reminders to your calendar?",
      },

      // ── Example 5: success confirmation (single callout, no extra words)
      {
        role: "user",
        content: "Archive that email",
      },
      {
        role: "assistant",
        content: "> Done: Archived — **Invoice #INV-2047 from Acme Corp** is out of your inbox.",
      },

      // ── Example 6: not found (error callout + helpful follow-up)
      {
        role: "user",
        content: "Find my dentist appointment",
      },
      {
        role: "assistant",
        content:
          '> Error: No calendar event found matching "dentist" in the next 60 days.\n\n' +
          "Want me to search your emails for a booking confirmation instead?",
      },
    ];

    const conversation: OpenAI.ChatCompletionMessageParam[] = [
      systemMessage,
      ...fewShotExamples,
      ...history,
    ];

    const calendarEvents: CalendarEventSummary[] = [];
    const referencedEmails: EmailRef[] = [];
    const seenEmailIds = new Set<string>();
    const citedEmailIds = new Set<string>(); // explicitly cited by the AI via cite_emails
    const fallbackSummary = deriveFallbackSummary(messages);
    let finalContent = "";
    let emailSent = false;
    let calendarChanged = false;
    // The most recent tool error this turn, used as a fallback so the user
    // always hears *what* failed even if the model returns an empty reply.
    let lastToolError: string | null = null;

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      const completion = await openai.chat.completions.create({
        model: env.openaiModel,
        messages: conversation,
        tools: CHAT_TOOLS,
      });

      const choice = completion.choices[0]?.message;
      if (!choice || !choice.tool_calls?.length) {
        finalContent = choice?.content ?? "";
        await chatModel.addMessage(conversationIdToUse, "assistant", finalContent);
        break;
      }

      conversation.push(choice);
      await chatModel.addMessage(conversationIdToUse, "assistant", choice.content ?? null, {
        toolCalls: choice.tool_calls,
      });

      for (const toolCall of choice.tool_calls) {
        let result: unknown;
        switch (toolCall.function.name) {
          case "create_calendar_event": {
            const created = await runCreateCalendarEvent(userId, toolCall, {
              defaultTimeZone: timeZone,
              fallbackSummary,
            });
            result = created.result;
            if (created.event) {
              calendarEvents.push(created.event);
              calendarChanged = true;
            }
            break;
          }
          case "update_calendar_event": {
            const updated = await runUpdateCalendarEvent(userId, toolCall, {
              defaultTimeZone: timeZone,
            });
            result = updated.result;
            if (updated.event) {
              calendarEvents.push(updated.event);
              calendarChanged = true;
            }
            break;
          }
          case "delete_calendar_event": {
            const removed = await runDeleteCalendarEvent(userId, toolCall);
            result = removed.result;
            if (removed.deleted) calendarChanged = true;
            break;
          }
          case "search_calendar_events":
            result = await runSearchCalendarEvents(userId, toolCall, { defaultTimeZone: timeZone });
            break;
          case "search_emails": {
            result = await runSearchEmails(userId, toolCall);
            // Collect unique email refs so the UI can surface source links.
            const sr = result as {
              success?: boolean;
              emails?: Array<{ id: string; subject?: string; from?: string }>;
            };
            if (sr.success && Array.isArray(sr.emails)) {
              for (const e of sr.emails) {
                if (e.id && !seenEmailIds.has(e.id)) {
                  seenEmailIds.add(e.id);
                  referencedEmails.push({ id: e.id, subject: e.subject, from: e.from });
                }
              }
            }
            break;
          }
          case "send_email": {
            const sendResult = await runSendEmail(userId, toolCall, {
              attachments,
              maxBytesPerFile,
            });
            if ((sendResult as { success?: boolean }).success) emailSent = true;
            result = sendResult;
            break;
          }
          case "create_draft":
            result = await runCreateDraft(userId, toolCall, { attachments, maxBytesPerFile });
            break;
          case "archive_email":
            result = await runArchiveEmail(userId, toolCall);
            break;
          case "cite_emails": {
            // The AI uses this to explicitly tell us which emails it actually cited.
            // We record those IDs so the UI shows only relevant source links.
            const citeArgs = JSON.parse(toolCall.function.arguments) as { emailIds?: unknown };
            if (Array.isArray(citeArgs.emailIds)) {
              for (const id of citeArgs.emailIds) {
                if (typeof id === "string" && id) citedEmailIds.add(id);
              }
            }
            result = { success: true };
            break;
          }
          default:
            result = { success: false, error: `Unknown tool: ${toolCall.function.name}` };
        }

        const failure = result as { success?: boolean; error?: string };
        if (failure.success === false && failure.error) {
          lastToolError = failure.error;
        }

        conversation.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
        await chatModel.addMessage(conversationIdToUse, "tool", JSON.stringify(result), {
          toolResults: { toolCallId: toolCall.id, result },
        });
      }

      if (iteration === MAX_TOOL_ITERATIONS - 1) {
        const followUp = await openai.chat.completions.create({
          model: env.openaiModel,
          messages: conversation,
        });
        finalContent = followUp.choices[0]?.message?.content ?? "";
        await chatModel.addMessage(conversationIdToUse, "assistant", finalContent);
      }
    }

    // Safety net: if the model finished without saying anything but a tool
    // failed this turn, surface the error instead of returning a blank reply.
    if (!finalContent.trim() && lastToolError) {
      finalContent = `Sorry, that didn't go through: ${lastToolError}`;
      await chatModel.addMessage(conversationIdToUse, "assistant", finalContent);
    }

    // If the AI explicitly cited emails via cite_emails, show only those.
    // If it never called cite_emails (e.g. calendar-only turns), fall back to all fetched emails.
    const finalReferencedEmails =
      citedEmailIds.size > 0
        ? referencedEmails.filter((e) => citedEmailIds.has(e.id))
        : referencedEmails;

    return {
      message: { role: "assistant", content: finalContent },
      calendarEvents,
      referencedEmails: finalReferencedEmails,
      conversationId: conversationIdToUse,
      emailSent,
      calendarChanged,
    };
  },
};
