"use client";

import type { CalendarEventSummary } from "@repo/shared";
import { cn, formatEventRange, isAllDay } from "@/lib/ui";

export function EventBlock({
  event,
  accent = false,
}: {
  event: CalendarEventSummary;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-ctl)] px-2 py-1.5 text-left transition-colors",
        accent
          ? "bg-accent-fill text-accent-light"
          : "bg-surface text-ink hairline hover:border-accent",
      )}
    >
      <p className="truncate text-xs font-medium">{event.summary || "(no title)"}</p>
      <p className="truncate text-[11px] opacity-80">
        {isAllDay(event) ? "All day" : formatEventRange(event)}
      </p>
    </div>
  );
}
