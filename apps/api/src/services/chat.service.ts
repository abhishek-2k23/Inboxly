import type { CalendarEventDateTime, CalendarEventSummary, ChatMessage } from "@repo/shared";
import type OpenAI from "openai";
import { env } from "../env.js";
import { openai } from "../lib/openai.js";
import { chatModel } from "../models/chat.model.js";
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
        },
        required: ["summary", "start", "end"],
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
        "Use mode='search' with a query for requests about a topic, e.g. 'the invoice from Acme' or 'the email about the roadmap'.",
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
              "A natural-language description of the email(s) to find, e.g. 'invoice from Acme' or 'email from Priya about the roadmap'. Optional when mode='recent'.",
          },
          limit: {
            type: "number",
            description: "Maximum number of matching emails to return (default 5, max 10).",
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
        "from the original email. For a brand-new email, provide `to` and `subject` explicitly.",
      parameters: {
        type: "object",
        properties: {
          body: {
            type: "string",
            description:
              "The plain-text body of the email/reply, written based on the user's instructions.",
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
];

interface CreateCalendarEventArgs {
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  timeZone?: string;
  attendees?: { email: string }[];
}

const ALL_DAY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Caps how many rounds of tool calls a single completion can make (e.g. search_emails then create_email_draft). */
const MAX_TOOL_ITERATIONS = 5;

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

/** Derives a fallback event title from the most recent user message when the model doesn't supply one. */
function deriveFallbackSummary(messages: ChatMessage[]): string {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
  const text = lastUserMessage?.content.trim() ?? "";
  if (!text) return "New event";
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
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

const DEFAULT_EMAIL_SEARCH_LIMIT = 5;
const MAX_EMAIL_SEARCH_LIMIT = 10;
const EMAIL_BODY_PREVIEW_LENGTH = 2000;

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
): Promise<unknown> {
  try {
    const args = JSON.parse(toolCall.function.arguments) as SendEmailArgs;
    const sent = await emailService.sendEmail(userId, {
      to: args.to,
      subject: args.subject,
      body: args.body,
      replyToEmailId: args.replyToEmailId,
    });
    return { success: true, sent };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send the email",
    };
  }
}

export interface ChatCompletionResult {
  message: ChatMessage;
  calendarEvents: CalendarEventSummary[];
  conversationId: number;
}

export const chatService = {
  async getCompletion(
    userId: number,
    messages: ChatMessage[],
    timeZone?: string,
    conversationId?: number,
  ): Promise<ChatCompletionResult> {
    const conversationIdToUse = await chatModel.getOrCreateConversation(
      userId,
      conversationId,
      conversationId === undefined ? deriveConversationTitle(messages) : null,
    );

    const latestMessage = messages[messages.length - 1];
    if (latestMessage) {
      await chatModel.addMessage(conversationIdToUse, latestMessage.role, latestMessage.content);
    }

    const localNow = formatLocalDateTime(timeZone);
    const timeZoneLabel = timeZone ?? "UTC";

    const systemMessage: OpenAI.ChatCompletionMessageParam = {
      role: "system",
      content:
        `You are an assistant embedded in a calendar and email app. ` +
        `You may ONLY help with the following tasks: ` +
        `(1) finding/looking up emails and summarizing one or more emails, ` +
        `(2) drafting a reply to an email, ` +
        `(3) suggesting a category or label for an email, ` +
        `(4) creating events on the user's Google Calendar, and ` +
        `(5) drafting a new email (subject and body). ` +
        `If the user asks for anything outside this list - general knowledge questions, coding help, unrelated chit-chat, or any other task - politely decline and explain that you can only help with the email and calendar tasks listed above. Do not attempt the task. ` +
        `\n\n` +
        `For emails: when the user asks you to find, look up, summarize, or reply to an email, call the search_emails tool. ` +
        `Use mode='recent' for "latest"/"newest"/"most recent" email requests (sorted by date, no query needed), and ` +
        `mode='search' with a query describing the topic/sender/subject for everything else. Use the returned emails' ` +
        `content to write your summary, including the sender and subject so the user knows which email you mean. ` +
        `Remember the \`id\` of any email you fetch - if the user later refers to "that email" or "it" in a follow-up ` +
        `message, reuse that \`id\`. ` +
        `When the user asks you to reply to or send an email, call send_email - this sends the email immediately via Gmail. ` +
        `Pass \`replyToEmailId\` (the \`id\` from search_emails) when replying to an existing email so it threads correctly, ` +
        `or \`to\`/\`subject\` for a new email. After it succeeds, tell the user the email was sent. ` +
        `\n\n` +
        `For calendar events: The user's current local date and time is ${localNow} in the ${timeZoneLabel} timezone. ` +
        `When the user asks you to schedule, book, or create something on their calendar, call the create_calendar_event tool. ` +
        `Resolve relative dates and times (e.g. "tomorrow at 3pm", "next Monday") against the user's current local date/time above. ` +
        `Express start/end as a local date-time without a UTC offset (e.g. 2026-06-15T15:00:00) and set timeZone to "${timeZoneLabel}" unless the user explicitly asks for a different timezone. ` +
        `Both start and end must use the same format: either both a plain date (YYYY-MM-DD) for an all-day event, or both a local date-time. ` +
        `If the user does not give an explicit title for the event, create a short, descriptive title based on the conversation.`,
    };

    const history = await chatModel.getConversationMessages(conversationIdToUse);
    const conversation: OpenAI.ChatCompletionMessageParam[] = [systemMessage, ...history];

    const calendarEvents: CalendarEventSummary[] = [];
    const fallbackSummary = deriveFallbackSummary(messages);
    let finalContent = "";

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
            if (created.event) calendarEvents.push(created.event);
            break;
          }
          case "search_emails":
            result = await runSearchEmails(userId, toolCall);
            break;
          case "send_email":
            result = await runSendEmail(userId, toolCall);
            break;
          default:
            result = { success: false, error: `Unknown tool: ${toolCall.function.name}` };
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

    return {
      message: { role: "assistant", content: finalContent },
      calendarEvents,
      conversationId: conversationIdToUse,
    };
  },
};
