"use client";

import type { CalendarEventSummary } from "@repo/shared";
import { cn } from "@/lib/ui";
import { addDays, sameDay, startOfWeek, WEEKDAYS } from "@/lib/calendar-utils";
import { EventBlock } from "@/components/calendar/event-block";
import { EventEntry } from "@/components/calendar/event-entry";

export function WeekView({
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
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const today = new Date();
  return (
    <div className="grid min-h-full grid-cols-7 gap-2">
      {days.map((d) => {
        const isToday = sameDay(d, today);
        const list = byDay.get(d.toDateString()) ?? [];
        return (
          <div
            key={d.toISOString()}
            className={cn(
              "hairline flex min-h-[60vh] flex-col rounded-[var(--radius-card)] p-2",
              isToday ? "bg-panel" : "bg-page",
            )}
          >
            <button
              type="button"
              onClick={() => onPick(d)}
              className="hover:bg-surface mb-2 flex items-center justify-between rounded-[var(--radius-ctl)] px-1 py-1 text-left transition-colors"
            >
              <span className="text-ink-3 text-xs">{WEEKDAYS[d.getDay()]}</span>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isToday ? "bg-accent text-accent-ink" : "text-ink",
                )}
              >
                {d.getDate()}
              </span>
            </button>
            <div className="flex flex-col gap-1.5">
              {list.map((e, i) => (
                <EventEntry key={e.id} event={e} onSelect={onSelectEvent}>
                  <EventBlock event={e} accent={isToday && i === 0} />
                </EventEntry>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
