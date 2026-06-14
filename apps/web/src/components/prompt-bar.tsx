"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CalendarEventSummary, ChatMessage } from "@repo/shared";
import { sendChatMessage } from "@/lib/api";
import { cn, formatEventRange } from "@/lib/ui";
import { Chip, IconButton, ThinkingDots } from "@/components/ui";
import { useToast } from "@/components/toast";

const DEFAULT_SUGGESTIONS = [
  "Summarize my unread emails",
  "Send invite to Abhishek, Thu 9 AM",
  "Reply to the latest email saying I'll review today",
  "What's on my calendar tomorrow?",
];

interface PromptResult {
  reply: string;
  events: CalendarEventSummary[];
}

/**
 * The prompt-first command bar. Talks to the AI chat endpoint, shows a subtle
 * thinking pulse (never a spinner), and renders an inline result preview with
 * the assistant's reply plus any calendar events it created. `onActivity`
 * lets the host page refresh its data after the AI takes an action.
 */
export function PromptBar({
  suggestions = DEFAULT_SUGGESTIONS,
  onActivity,
  placeholder = "Tell Inboxly what to do…",
}: {
  suggestions?: string[];
  onActivity?: () => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | undefined>(undefined);
  const [isThinking, setIsThinking] = useState(false);
  const [result, setResult] = useState<PromptResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Cmd/Ctrl+K focuses the prompt from anywhere; pages also dispatch this event.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    function onFocus() {
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("inboxly:focus-prompt", onFocus);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("inboxly:focus-prompt", onFocus);
    };
  }, []);

  const run = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking) return;

      const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
      setMessages(next);
      setInput("");
      setIsThinking(true);
      const toastId = toast.loading("Thinking…");

      try {
        const res = await sendChatMessage(next, conversationId);
        setMessages([...next, res.message]);
        setConversationId(res.conversationId);
        setResult({ reply: res.message.content, events: res.calendarEvents ?? [] });
        const created = res.calendarEvents?.length ?? 0;
        toast.success(created > 0 ? `Done · ${created} event added` : "Done", toastId);
        onActivity?.();
      } catch {
        toast.error("Couldn't reach the AI. Try again later.", toastId);
      } finally {
        setIsThinking(false);
      }
    },
    [messages, conversationId, isThinking, onActivity, toast],
  );

  return (
    <div className="flex flex-col gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(input);
        }}
        className="bg-surface hairline focus-within:border-accent flex items-center gap-2 rounded-[var(--radius-card)] px-3 py-2"
      >
        <i className="ti ti-sparkles text-accent-light" aria-hidden />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="text-ink placeholder:text-ink-3 min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        {isThinking ? (
          <ThinkingDots />
        ) : (
          <IconButton icon="ti-send" label="Send" shortcut="Enter" type="submit" accent />
        )}
      </form>

      {/* contextual suggestion chips — max 4 visible, horizontally scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {suggestions.map((s) => (
          <Chip key={s} onClick={() => void run(s)}>
            <i className="ti ti-bolt text-accent-light" aria-hidden />
            {s}
          </Chip>
        ))}
      </div>

      {/* inline result preview (not a modal) */}
      {result && (
        <div className="bg-panel hairline flex flex-col gap-3 rounded-[var(--radius-card)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <i className="ti ti-sparkles text-accent-light mt-0.5" aria-hidden />
              <p className="text-ink whitespace-pre-wrap text-sm">{result.reply}</p>
            </div>
            <IconButton icon="ti-x" label="Dismiss" size="sm" onClick={() => setResult(null)} />
          </div>

          {result.events.length > 0 && (
            <div className="flex flex-col gap-2">
              {result.events.map((event) => (
                <Link
                  key={event.id}
                  href={`/app/calendar`}
                  className={cn(
                    "bg-surface hairline hover:border-accent flex items-center gap-3 rounded-[var(--radius-ctl)] p-3 transition-colors",
                  )}
                >
                  <span className="bg-accent-fill text-accent-light flex h-9 w-9 items-center justify-center rounded-[var(--radius-ctl)]">
                    <i className="ti ti-calendar-event" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="text-ink block truncate text-sm font-medium">
                      {event.summary || "(no title)"}
                    </span>
                    <span className="text-ink-2 block truncate text-xs">
                      {formatEventRange(event)}
                      {event.attendees && event.attendees.length > 0
                        ? ` · ${event.attendees.length} guest${event.attendees.length > 1 ? "s" : ""}`
                        : ""}
                    </span>
                  </span>
                  <i className="ti ti-arrow-right text-ink-3 ml-auto" aria-hidden />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
