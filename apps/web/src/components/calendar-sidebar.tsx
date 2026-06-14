"use client";

import Link from "next/link";
import type { CalendarEventSummary } from "@repo/shared";
import { useCalendarEvents } from "@/hooks/use-calendar-events";
import { cn, eventStart, formatEventRange, PRIORITY_COLOR } from "@/lib/ui";
import { sameDay } from "@/lib/calendar-utils";
import { IconButton } from "@/components/ui";

/** Today's agenda rail shown beside the inbox. */
export function CalendarSidebar() {
  const { events, loaded } = useCalendarEvents();

  const today = events
    .map((e) => ({ e, start: eventStart(e) }))
    .filter(
      (x): x is { e: CalendarEventSummary; start: Date } =>
        x.start !== null && sameDay(x.start, new Date()),
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <aside className="hairline-l flex w-72 shrink-0 flex-col overflow-hidden">
      <header className="hairline-b flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <i className="ti ti-calendar text-accent-light" aria-hidden />
          <span className="text-ink text-sm font-medium">Today</span>
          <span className="text-ink-3 text-xs">
            {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        </div>
        <Link href="/app/calendar">
          <IconButton icon="ti-plus" label="New event" size="sm" />
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {!loaded && (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-14 rounded-[var(--radius-ctl)]" />
            ))}
          </div>
        )}

        {loaded && today.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <i className="ti ti-calendar-off text-ink-3 text-2xl" aria-hidden />
            <p className="text-ink-2 text-xs">Nothing scheduled today.</p>
          </div>
        )}

        <ul className="flex flex-col gap-2">
          {today.map(({ e }, idx) => {
            const color = idx === 0 ? PRIORITY_COLOR.urgent : PRIORITY_COLOR.low;
            return (
              <li key={e.id}>
                <Link
                  href="/app/calendar"
                  className="bg-surface hairline hover:border-accent flex gap-3 rounded-[var(--radius-ctl)] p-3 transition-colors"
                >
                  <span
                    className="mt-0.5 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="min-w-0">
                    <span className="text-ink block truncate text-sm">
                      {e.summary || "(no title)"}
                    </span>
                    <span className="text-ink-2 block text-xs">{formatEventRange(e)}</span>
                    {e.location && (
                      <span className="text-ink-3 mt-0.5 flex items-center gap-1 truncate text-xs">
                        <i className="ti ti-map-pin" aria-hidden />
                        {e.location}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <Link
        href="/app/calendar"
        className={cn(
          "text-ink-2 hairline-t hover:text-ink flex items-center justify-center gap-2 px-4 py-3 text-xs transition-colors",
        )}
      >
        <i className="ti ti-calendar-week" aria-hidden />
        Open full calendar
      </Link>
    </aside>
  );
}
