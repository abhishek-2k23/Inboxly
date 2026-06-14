"use client";

import type { CalendarEventSummary } from "@repo/shared";
import { sameDay } from "@/lib/calendar-utils";
import { EventBlock } from "@/components/calendar/event-block";
import { EventEntry } from "@/components/calendar/event-entry";

export function DayView({
  anchor,
  byDay,
  onPick,
  onSelectEvent,
}: {
  anchor: Date;
  byDay: Map<string, CalendarEventSummary[]>;
  onPick: (d: Date) => void;
  onSelectEvent: (event: CalendarEventSummary) => void;
}) {
  const list = byDay.get(anchor.toDateString()) ?? [];
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-2">
      {list.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <i className="ti ti-calendar-off text-ink-3 text-3xl" aria-hidden />
          <p className="text-ink-2 text-sm">Nothing scheduled.</p>
          <button
            type="button"
            onClick={() => onPick(anchor)}
            className="text-accent-light text-xs hover:underline"
          >
            Create an event
          </button>
        </div>
      )}
      {list.map((e, i) => (
        <EventEntry key={e.id} event={e} onSelect={onSelectEvent}>
          <EventBlock event={e} accent={i === 0 && sameDay(anchor, new Date())} />
        </EventEntry>
      ))}
    </div>
  );
}
