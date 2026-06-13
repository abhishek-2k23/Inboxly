import type { CalendarEventDateTime, CalendarEventSummary, ChatMessage } from "@repo/shared";
import type OpenAI from "openai";
import { env } from "../env.js";
import { openai } from "../lib/openai.js";
import { chatModel } from "../models/chat.model.js";
import { calendarService } from "./calendar.service.js";

const CALENDAR_TOOLS: OpenAI.ChatCompletionTool[] = [
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

function toEventDateTime(value: string, timeZone?: string): CalendarEventDateTime {
  if (ALL_DAY_DATE_PATTERN.test(value)) {
    return { date: value };
  }
  return { dateTime: value, timeZone };
}

function toChatCompletionMessages(messages: ChatMessage[]): OpenAI.ChatCompletionMessageParam[] {
  return messages.map(
    (message) =>
      ({ role: message.role, content: message.content }) as OpenAI.ChatCompletionMessageParam,
  );
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
        `(1) drafting a reply to an email, ` +
        `(2) summarizing one or more emails, ` +
        `(3) suggesting a category or label for an email, ` +
        `(4) creating events on the user's Google Calendar, and ` +
        `(5) drafting a new email (subject and body). ` +
        `If the user asks for anything outside this list - general knowledge questions, coding help, unrelated chit-chat, or any other task - politely decline and explain that you can only help with the email and calendar tasks listed above. Do not attempt the task. ` +
        `\n\n` +
        `For calendar events: The user's current local date and time is ${localNow} in the ${timeZoneLabel} timezone. ` +
        `When the user asks you to schedule, book, or create something on their calendar, call the create_calendar_event tool. ` +
        `Resolve relative dates and times (e.g. "tomorrow at 3pm", "next Monday") against the user's current local date/time above. ` +
        `Express start/end as a local date-time without a UTC offset (e.g. 2026-06-15T15:00:00) and set timeZone to "${timeZoneLabel}" unless the user explicitly asks for a different timezone. ` +
        `Both start and end must use the same format: either both a plain date (YYYY-MM-DD) for an all-day event, or both a local date-time. ` +
        `If the user does not give an explicit title for the event, create a short, descriptive title based on the conversation.`,
    };

    const conversation: OpenAI.ChatCompletionMessageParam[] = [
      systemMessage,
      ...toChatCompletionMessages(messages),
    ];

    const completion = await openai.chat.completions.create({
      model: env.openaiModel,
      messages: conversation,
      tools: CALENDAR_TOOLS,
    });

    const choice = completion.choices[0]?.message;
    if (!choice) {
      await chatModel.addMessage(conversationIdToUse, "assistant", "");
      return {
        message: { role: "assistant", content: "" },
        calendarEvents: [],
        conversationId: conversationIdToUse,
      };
    }

    if (!choice.tool_calls?.length) {
      const content = choice.content ?? "";
      await chatModel.addMessage(conversationIdToUse, "assistant", content);
      return {
        message: { role: "assistant", content },
        calendarEvents: [],
        conversationId: conversationIdToUse,
      };
    }

    conversation.push(choice);
    await chatModel.addMessage(conversationIdToUse, "assistant", choice.content ?? null, {
      toolCalls: choice.tool_calls,
    });

    const calendarEvents: CalendarEventSummary[] = [];
    const fallbackSummary = deriveFallbackSummary(messages);

    for (const toolCall of choice.tool_calls) {
      let result: unknown;
      if (toolCall.function.name === "create_calendar_event") {
        const created = await runCreateCalendarEvent(userId, toolCall, {
          defaultTimeZone: timeZone,
          fallbackSummary,
        });
        result = created.result;
        if (created.event) calendarEvents.push(created.event);
      } else {
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

    const followUp = await openai.chat.completions.create({
      model: env.openaiModel,
      messages: conversation,
      tools: CALENDAR_TOOLS,
    });

    const finalChoice = followUp.choices[0]?.message;
    const finalContent = finalChoice?.content ?? "";
    await chatModel.addMessage(conversationIdToUse, "assistant", finalContent);
    return {
      message: { role: "assistant", content: finalContent },
      calendarEvents,
      conversationId: conversationIdToUse,
    };
  },
};
