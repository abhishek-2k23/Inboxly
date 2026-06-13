import type { CalendarEventDateTime, CalendarEventSummary, ChatMessage } from "@repo/shared";
import type OpenAI from "openai";
import { env } from "../env.js";
import { openai } from "../lib/openai.js";
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
          summary: { type: "string", description: "Short title of the event." },
          description: {
            type: "string",
            description: "Longer description or notes for the event.",
          },
          location: { type: "string", description: "Location of the event." },
          start: {
            type: "string",
            description:
              "Start of the event. For timed events, an ISO 8601 date-time with UTC offset (e.g. 2026-06-15T14:00:00-07:00). For all-day events, a date (YYYY-MM-DD).",
          },
          end: {
            type: "string",
            description: "End of the event, in the same format as `start`.",
          },
          timeZone: {
            type: "string",
            description:
              "IANA timezone for `start`/`end` when they don't already include a UTC offset, e.g. America/Los_Angeles.",
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

async function runCreateCalendarEvent(
  userId: number,
  toolCall: OpenAI.ChatCompletionMessageToolCall,
): Promise<{ result: unknown; event: CalendarEventSummary | null }> {
  try {
    const args = JSON.parse(toolCall.function.arguments) as CreateCalendarEventArgs;
    const event = await calendarService.createEvent(userId, {
      summary: args.summary,
      description: args.description,
      location: args.location,
      start: toEventDateTime(args.start, args.timeZone),
      end: toEventDateTime(args.end, args.timeZone),
      attendees: args.attendees,
    });
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
}

export const chatService = {
  async getCompletion(userId: number, messages: ChatMessage[]): Promise<ChatCompletionResult> {
    const systemMessage: OpenAI.ChatCompletionMessageParam = {
      role: "system",
      content:
        `You are a helpful assistant embedded in a calendar and email app. ` +
        `The current date and time is ${new Date().toISOString()} (UTC). ` +
        `When the user asks you to schedule, book, or create something on their calendar, call the create_calendar_event tool. ` +
        `Resolve relative dates and times (e.g. "tomorrow at 3pm") against the current date/time above, and include a timeZone when the user implies one.`,
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
      return { message: { role: "assistant", content: "" }, calendarEvents: [] };
    }

    if (!choice.tool_calls?.length) {
      return { message: { role: "assistant", content: choice.content ?? "" }, calendarEvents: [] };
    }

    conversation.push(choice);

    const calendarEvents: CalendarEventSummary[] = [];

    for (const toolCall of choice.tool_calls) {
      if (toolCall.function.name === "create_calendar_event") {
        const { result, event } = await runCreateCalendarEvent(userId, toolCall);
        if (event) calendarEvents.push(event);
        conversation.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      } else {
        conversation.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            success: false,
            error: `Unknown tool: ${toolCall.function.name}`,
          }),
        });
      }
    }

    const followUp = await openai.chat.completions.create({
      model: env.openaiModel,
      messages: conversation,
      tools: CALENDAR_TOOLS,
    });

    const finalChoice = followUp.choices[0]?.message;
    return { message: { role: "assistant", content: finalChoice?.content ?? "" }, calendarEvents };
  },
};
