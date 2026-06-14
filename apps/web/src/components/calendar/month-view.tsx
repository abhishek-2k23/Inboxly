"use client";

import type { CalendarEventSummary } from "@repo/shared";
import { cn } from "@/lib/ui";
import { addDays, sameDay, startOfWeek, WEEKDAYS } from "@/lib/calendar-utils";
import { MonthEntry } from "@/components/calendar/month-entry";

export function MonthView({
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
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(first);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const today = new Date();
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-ink-3 px-2 py-1 text-center text-xs">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d) => {
          const inMonth = d.getMonth() === anchor.getMonth();
          const isToday = sameDay(d, today);
          const list = byDay.get(d.toDateString()) ?? [];
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onPick(d)}
              className={cn(
                "hairline hover:border-accent flex min-h-[92px] flex-col gap-1 rounded-[var(--radius-ctl)] p-1.5 text-left transition-colors",
                inMonth ? "bg-page" : "bg-page/40",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center self-end rounded-full text-xs",
                  isToday ? "bg-accent text-accent-ink" : inMonth ? "text-ink-2" : "text-ink-3",
                )}
              >
                {d.getDate()}
              </span>
              <div className="flex flex-col gap-0.5">
                {list.slice(0, 3).map((e) => (
                  <MonthEntry key={e.id} event={e} onSelect={onSelectEvent} />
                ))}
                {list.length > 3 && (
                  <span className="text-ink-3 text-[10px]">+{list.length - 3} more</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
