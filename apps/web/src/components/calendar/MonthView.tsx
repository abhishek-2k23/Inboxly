"use client";

import { useEffect, useRef, useState } from "react";
import type { CalendarEventSummary } from "@repo/shared";
import { buildMonthGrid, isSameMonth, WEEKDAYS } from "@/lib/calendar-utils";
import { avatarColor, cn, eventStart, isAllDay } from "@/lib/ui";
import { EventQuickInfo, HoverPopover } from "./EventPopover";

const MAX_VISIBLE = 3;

function eventTimeLabel(event: CalendarEventSummary): string | null {
  if (isAllDay(event)) return null;
  const start = eventStart(event);
  if (!start) return null;
  return start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function MonthEventChip({
  event,
  flip,
  align,
  onSelect,
}: {
  event: CalendarEventSummary;
  flip: boolean;
  align: "left" | "right";
  onSelect: () => void;
}) {
  const title = event.summary?.trim() || "(no title)";
  const timeLabel = eventTimeLabel(event);

  return (
    <HoverPopover content={<EventQuickInfo event={event} />} flip={flip} align={align} side>
      <button
        type="button"
        onClick={onSelect}
        className="hover:bg-surface-hover flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition-colors"
      >
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 rounded-full"
          style={{
            backgroundColor: avatarColor(event.id),
            boxShadow: `0 0 0 3px ${avatarColor(event.id)}1f`,
          }}
        />
        {timeLabel && <span className="text-ink-3 shrink-0 text-[0.68rem]">{timeLabel}</span>}
        <span className="text-ink truncate text-xs font-medium">{title}</span>
      </button>
    </HoverPopover>
  );
}

function DayOverflowList({
  events,
  flip,
  onSelect,
  onClose,
}: {
  events: CalendarEventSummary[];
  flip: boolean;
  onSelect: (e: CalendarEventSummary) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={cn(
        "border-line bg-panel animate-scale-in ring-line/50 absolute left-0 z-50 max-h-72 w-60 overflow-y-auto rounded-xl border p-1.5 shadow-xl ring-1",
        flip ? "bottom-full mb-1" : "top-full mt-1",
      )}
    >
      {events.map((event) => (
        <button
          key={event.id}
          type="button"
          onClick={() => onSelect(event)}
          className="hover:bg-surface-hover flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors"
        >
          <span
            aria-hidden
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: avatarColor(event.id) }}
          />
          <span className="text-ink truncate text-xs">{event.summary?.trim() || "(no title)"}</span>
        </button>
      ))}
    </div>
  );
}

/** Classic month grid: 6 weeks x 7 days, checkerboard cell shading, up to 3 events per day + overflow popover. */
export function MonthView({
  anchor,
  byDay,
  onSelectEvent,
}: {
  anchor: Date;
  byDay: Map<string, CalendarEventSummary[]>;
  onSelectEvent: (event: CalendarEventSummary) => void;
}) {
  const days = buildMonthGrid(anchor);
  const today = new Date();
  const [overflowOpenFor, setOverflowOpenFor] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="border-line grid grid-cols-7 border-b">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="text-ink-3 px-2 py-2.5 text-center text-[0.7rem] font-semibold uppercase tracking-widest"
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {days.map((day, i) => {
          const key = day.toDateString();
          const inMonth = isSameMonth(day, anchor);
          const isToday = day.toDateString() === today.toDateString();
          const events = (byDay.get(key) ?? []).slice().sort((a, b) => {
            const sa = eventStart(a)?.getTime() ?? 0;
            const sb = eventStart(b)?.getTime() ?? 0;
            return sa - sb;
          });
          const visible = events.slice(0, MAX_VISIBLE);
          const overflow = events.slice(MAX_VISIBLE);
          const rowIndex = Math.floor(i / 7);
          const flip = rowIndex >= 4;
          const colIndex = i % 7;
          const lastCol = colIndex === 6;
          const popoverAlign = colIndex >= 5 ? "right" : "left";

          return (
            <div
              key={key}
              className={cn(
                "border-line-subtle group/cell relative flex flex-col gap-0.5 border-b p-1.5 transition-colors",
                !lastCol && "border-r",
                inMonth ? "hover:bg-surface-hover/50" : "bg-surface/30",
                isToday && "bg-accent/[0.06]",
              )}
            >
              <span
                className={cn(
                  "mb-0.5 grid h-6 w-6 place-items-center rounded-full text-xs font-semibold transition-colors",
                  isToday
                    ? "bg-accent text-accent-ink shadow-sm"
                    : inMonth
                      ? "text-ink-2 group-hover/cell:text-ink"
                      : "text-ink-3",
                )}
              >
                {day.getDate()}
              </span>

              <div className="flex min-h-0 flex-1 flex-col gap-0.5">
                {visible.map((event) => (
                  <MonthEventChip
                    key={event.id}
                    event={event}
                    flip={flip}
                    align={popoverAlign}
                    onSelect={() => onSelectEvent(event)}
                  />
                ))}
              </div>

              {overflow.length > 0 && (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setOverflowOpenFor((cur) => (cur === key ? null : key))}
                    className="text-ink-3 hover:text-accent rounded px-1.5 text-[0.7rem] font-semibold transition-colors"
                  >
                    +{overflow.length} more
                  </button>
                  {overflowOpenFor === key && (
                    <DayOverflowList
                      events={events}
                      flip={flip}
                      onSelect={(event) => {
                        setOverflowOpenFor(null);
                        onSelectEvent(event);
                      }}
                      onClose={() => setOverflowOpenFor(null)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
