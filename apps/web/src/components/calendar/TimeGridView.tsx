"use client";

import { useEffect, useRef, useState } from "react";
import type { CalendarEventSummary } from "@repo/shared";
import {
  HOUR_HEIGHT,
  HOURS,
  hourLabel,
  layoutTimedEvents,
  minutesFromMidnight,
  WEEKDAYS,
} from "@/lib/calendar-utils";
import { avatarColor, cn, eventEnd, eventStart, formatEventRange, isAllDay } from "@/lib/ui";
import { EventQuickInfo, HoverPopover } from "./EventPopover";

const GUTTER_WIDTH = 56; // px, matches the `w-14` time-label column

function isToday(d: Date): boolean {
  return d.toDateString() === new Date().toDateString();
}

function AllDayChip({ event, onSelect }: { event: CalendarEventSummary; onSelect: () => void }) {
  return (
    <HoverPopover content={<EventQuickInfo event={event} />}>
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition-colors hover:brightness-95"
        style={{ backgroundColor: `${avatarColor(event.id)}22` }}
      >
        <span
          aria-hidden
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: avatarColor(event.id) }}
        />
        <span className="text-ink truncate text-xs font-medium">
          {event.summary?.trim() || "(no title)"}
        </span>
      </button>
    </HoverPopover>
  );
}

function TimeGridEventBlock({
  event,
  top,
  height,
  left,
  width,
  flip,
  onSelect,
}: {
  event: CalendarEventSummary;
  top: number;
  height: number;
  left: string;
  width: string;
  flip: boolean;
  onSelect: () => void;
}) {
  const title = event.summary?.trim() || "(no title)";
  const accent = avatarColor(event.id);

  return (
    <div className="absolute z-[5]" style={{ top, height, left, width, padding: "0 1px" }}>
      <HoverPopover content={<EventQuickInfo event={event} />} flip={flip}>
        <button
          type="button"
          onClick={onSelect}
          className="flex h-full w-full flex-col overflow-hidden rounded-md border-l-2 px-1.5 py-0.5 text-left shadow-sm transition-[filter] hover:brightness-95"
          style={{ backgroundColor: `${accent}1f`, borderColor: accent }}
        >
          <span className="text-ink truncate text-[0.72rem] font-medium leading-tight">
            {title}
          </span>
          {height > 32 && (
            <span className="text-ink-3 truncate text-[0.65rem] leading-tight">
              {formatEventRange(event)}
            </span>
          )}
        </button>
      </HoverPopover>
    </div>
  );
}

function DayColumn({
  day,
  events,
  now,
  onSelectEvent,
}: {
  day: Date;
  events: CalendarEventSummary[];
  now: Date;
  onSelectEvent: (event: CalendarEventSummary) => void;
}) {
  const layout = layoutTimedEvents(
    events,
    (e) => eventStart(e)?.getTime() ?? 0,
    (e) => eventEnd(e)?.getTime() ?? (eventStart(e)?.getTime() ?? 0) + 30 * 60000,
  );
  const todayCol = isToday(day);

  return (
    <div className="border-line relative flex-1 border-l">
      {HOURS.map((h) => (
        <div key={h} className="border-line border-b" style={{ height: HOUR_HEIGHT }} />
      ))}

      {todayCol && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 z-[6] flex items-center"
          style={{ top: (minutesFromMidnight(now) / 60) * HOUR_HEIGHT }}
        >
          <span className="bg-danger -ml-1 h-2 w-2 shrink-0 rounded-full" />
          <span className="bg-danger h-px flex-1" />
        </div>
      )}

      {layout.map(({ item: event, col, cols }) => {
        const start = eventStart(event);
        if (!start) return null;
        const end = eventEnd(event) ?? new Date(start.getTime() + 30 * 60000);
        const startMin = Math.max(0, minutesFromMidnight(start));
        const endMin = Math.min(24 * 60, Math.max(startMin + 20, minutesFromMidnight(end)));
        const top = (startMin / 60) * HOUR_HEIGHT;
        const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;

        return (
          <TimeGridEventBlock
            key={event.id}
            event={event}
            top={top}
            height={height}
            left={`${(col / cols) * 100}%`}
            width={`${100 / cols}%`}
            flip={top > 420}
            onSelect={() => onSelectEvent(event)}
          />
        );
      })}
    </div>
  );
}

/** Hourly time-grid for Day (1 column) and Week (7 columns) views, Google-Calendar style. */
export function TimeGridView({
  days,
  byDay,
  onSelectEvent,
}: {
  days: Date[];
  byDay: Map<string, CalendarEventSummary[]>;
  onSelectEvent: (event: CalendarEventSummary) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 6 * HOUR_HEIGHT - 32 });
  }, []);

  const dayEvents = days.map((day) => {
    const all = byDay.get(day.toDateString()) ?? [];
    return {
      day,
      allDay: all.filter((e) => isAllDay(e)),
      timed: all.filter((e) => !isAllDay(e)),
    };
  });
  const hasAllDay = dayEvents.some((d) => d.allDay.length > 0);

  return (
    <div className="flex h-full flex-col">
      {/* Day headers */}
      <div className="border-line flex shrink-0 border-b">
        <div style={{ width: GUTTER_WIDTH }} className="shrink-0" />
        {days.map((day) => (
          <div key={day.toDateString()} className="border-line flex-1 border-l py-2 text-center">
            <p className="text-ink-3 text-[0.7rem] font-medium uppercase tracking-wide">
              {WEEKDAYS[day.getDay()]}
            </p>
            <p
              className={cn(
                "mx-auto mt-0.5 grid h-7 w-7 place-items-center rounded-full text-sm font-semibold",
                isToday(day) ? "bg-accent text-accent-ink" : "text-ink",
              )}
            >
              {day.getDate()}
            </p>
          </div>
        ))}
      </div>

      {/* All-day row */}
      {hasAllDay && (
        <div className="border-line flex shrink-0 border-b">
          <div
            style={{ width: GUTTER_WIDTH }}
            className="text-ink-3 shrink-0 px-1.5 py-1.5 text-right text-[0.65rem]"
          >
            All-day
          </div>
          {dayEvents.map(({ day, allDay }) => (
            <div key={day.toDateString()} className="border-line flex-1 space-y-0.5 border-l p-1">
              {allDay.map((event) => (
                <AllDayChip key={event.id} event={event} onSelect={() => onSelectEvent(event)} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Scrollable hour grid */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex" style={{ height: HOUR_HEIGHT * 24 }}>
          <div style={{ width: GUTTER_WIDTH }} className="shrink-0">
            {HOURS.map((h) => (
              <div key={h} className="relative" style={{ height: HOUR_HEIGHT }}>
                {h > 0 && (
                  <span className="text-ink-3 absolute right-2 top-0 -translate-y-1/2 text-[0.65rem]">
                    {hourLabel(h)}
                  </span>
                )}
              </div>
            ))}
          </div>
          {dayEvents.map(({ day, timed }) => (
            <DayColumn
              key={day.toDateString()}
              day={day}
              events={timed}
              now={now}
              onSelectEvent={onSelectEvent}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
