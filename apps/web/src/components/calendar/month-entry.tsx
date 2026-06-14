"use client";

import type { CalendarEventSummary } from "@repo/shared";
import { EventEntry } from "@/components/calendar/event-entry";

/** A single event chip in the month grid. */
export function MonthEntry({
  event,
  onSelect,
}: {
  event: CalendarEventSummary;
  onSelect: (event: CalendarEventSummary) => void;
}) {
  return (
    <EventEntry event={event} onSelect={onSelect}>
      <span className="bg-surface text-ink-2 group-hover/event:text-ink block truncate rounded px-1 py-0.5 text-[10px] transition-colors">
        {event.summary || "(no title)"}
      </span>
    </EventEntry>
  );
}
