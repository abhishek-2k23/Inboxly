"use client";

import { useCalendarStore } from "@/stores/calendar-store";
import { useEmailStore } from "@/stores/email-store";
import { PromptBar } from "@/components/prompt-bar";

const SUGGESTIONS = [
  "Summarize my unread emails",
  "What's on my calendar today?",
  "Draft a follow-up to the design team",
  "Schedule a 30-min sync tomorrow at 2 PM",
];

export default function ChatPage() {
  const loadEmails = useEmailStore((s) => s.loadEmails);
  const loadEvents = useCalendarStore((s) => s.loadEvents);

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center overflow-y-auto px-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="bg-accent-fill text-accent-light mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-card)]">
            <i className="ti ti-sparkles text-2xl" aria-hidden />
          </span>
          <h1 className="text-ink text-2xl font-medium tracking-tight">
            How can I help you today?
          </h1>
          <p className="text-ink-2 mt-2 max-w-md text-sm">
            Ask Inboxly to draft emails, summarize threads, schedule meetings, or manage your
            calendar — just type what you need.
          </p>
        </div>

        <PromptBar
          suggestions={SUGGESTIONS}
          placeholder="Ask Inboxly anything…"
          onActivity={() => {
            void loadEmails();
            void loadEvents();
          }}
        />
      </div>
    </div>
  );
}
