"use client";

import Link from "next/link";
import { useState } from "react";
import type { CalendarEventSummary, ChatMessage } from "@repo/shared";
import { sendChatMessage } from "@/lib/api";

function formatEventTime(event: CalendarEventSummary): string {
  const start = event.start?.dateTime ?? event.start?.date;
  const end = event.end?.dateTime ?? event.end?.date;
  if (!start) return "";
  return end ? `${start} – ${end}` : start;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [eventsByMessage, setEventsByMessage] = useState<Record<number, CalendarEventSummary[]>>(
    {},
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const { message, calendarEvents } = await sendChatMessage(nextMessages);
      const updatedMessages = [...nextMessages, message];
      setMessages(updatedMessages);
      if (calendarEvents && calendarEvents.length > 0) {
        setEventsByMessage((current) => ({
          ...current,
          [updatedMessages.length - 1]: calendarEvents,
        }));
      }
    } catch {
      setError("Something went wrong talking to the API. Is apps/api running?");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex min-h-48 flex-1 flex-col gap-3 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-slate-500">
            Send a message to test the AI endpoint at{" "}
            <code className="rounded bg-slate-800 px-1 py-0.5">/api/chat</code>.
          </p>
        )}
        {messages.map((message, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                message.role === "user"
                  ? "self-end bg-indigo-600 text-white"
                  : "self-start bg-slate-800 text-slate-100"
              }`}
            >
              {message.content}
            </div>
            {eventsByMessage[index]?.map((event) => (
              <Link
                key={event.id}
                href={`/calendar/${encodeURIComponent(event.id)}`}
                className="max-w-[85%] self-start rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm transition hover:border-slate-500"
              >
                <p className="font-medium text-slate-100">{event.summary || "(no title)"}</p>
                <p className="text-xs text-slate-500">{formatEventTime(event)}</p>
              </Link>
            ))}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask the AI something..."
          className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}
