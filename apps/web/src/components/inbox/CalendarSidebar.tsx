"use client";

import { useUser } from "@clerk/nextjs";
import { CalendarDays, ChevronRight, MapPin, Video } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CalendarEventSummary } from "@repo/shared";
import { useCalendarStore } from "@/stores/calendar-store";
import { avatarColor, cn, eventStart, formatEventRange, isAllDay } from "@/lib/ui";

function isToday(date: Date): boolean {
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function EventBlock({ event }: { event: CalendarEventSummary }) {
  const title = event.summary?.trim() || "(no title)";
  const hasMeeting = Boolean(event.hangoutLink);
  const accent = avatarColor(event.id ?? title);

  return (
    <a
      href={event.htmlLink ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="hover:bg-surface-hover group flex gap-3 rounded-lg py-2 pl-2.5 pr-2 transition-colors"
    >
      <span
        aria-hidden
        className="mt-0.5 w-0.5 shrink-0 self-stretch rounded-full"
        style={{ backgroundColor: accent }}
      />
      <span className="min-w-0 flex-1">
        <span className="text-ink block truncate text-sm font-medium">{title}</span>
        <span className="text-ink-3 mt-0.5 block text-xs">{formatEventRange(event)}</span>
        {event.location && !isAllDay(event) && (
          <span className="text-ink-3 mt-1 flex items-center gap-1 text-xs">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{event.location}</span>
          </span>
        )}
        {hasMeeting && (
          <span className="text-ink-3 mt-1 flex items-center gap-1 text-xs">
            <Video className="h-3 w-3 shrink-0" />
            <span className="truncate">Video call</span>
          </span>
        )}
      </span>
    </a>
  );
}

/** Right sidebar: today's calendar events plus a "Show all calendars" popover. */
export function CalendarSidebar() {
  const { user } = useUser();
  const events = useCalendarStore((s) => s.events);
  const loaded = useCalendarStore((s) => s.loaded);
  const loadEvents = useCalendarStore((s) => s.loadEvents);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!popoverOpen) return;
    function onClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [popoverOpen]);

  const todays = useMemo(() => {
    return events
      .filter((event) => {
        const start = eventStart(event);
        return start ? isToday(start) : false;
      })
      .sort((a, b) => (eventStart(a)?.getTime() ?? 0) - (eventStart(b)?.getTime() ?? 0));
  }, [events]);

  const accountEmail = user?.primaryEmailAddress?.emailAddress;

  return (
    <aside className="border-line bg-bg-secondary flex w-[300px] shrink-0 flex-col border-l">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center gap-2 px-5">
        <CalendarDays className="text-ink-2 h-[18px] w-[18px]" />
        <h2 className="text-ink text-sm font-semibold tracking-tight">Today&apos;s Schedule</h2>
      </div>

      {/* Events */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {!loaded ? (
          <div className="space-y-2 px-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-surface-hover h-14 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : todays.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <span className="border-line bg-surface text-ink-3 grid h-10 w-10 place-items-center rounded-lg border">
              <CalendarDays className="h-4 w-4" />
            </span>
            <p className="text-ink-2 mt-3 text-sm font-medium">Nothing scheduled</p>
            <p className="text-ink-3 mt-1 text-xs">Your day is wide open.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {todays.map((event) => (
              <EventBlock key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      {/* Show all calendars */}
      <div className="border-line relative shrink-0 border-t p-3" ref={popoverRef}>
        {popoverOpen && (
          <div className="border-line bg-panel absolute inset-x-3 bottom-[calc(100%-0.25rem)] mb-1 overflow-hidden rounded-xl border">
            <p className="text-ink-3 px-3 pb-1.5 pt-2.5 text-[0.7rem] font-medium uppercase tracking-wide">
              Connected calendars
            </p>
            <div className="flex items-center gap-2.5 px-3 py-2">
              <span className="bg-accent h-2.5 w-2.5 shrink-0 rounded-[3px]" />
              <span className="min-w-0 flex-1">
                <span className="text-ink block truncate text-sm">
                  {accountEmail ?? "Google Calendar"}
                </span>
                <span className="text-ink-3 block text-xs">Primary</span>
              </span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setPopoverOpen((open) => !open)}
          className="text-ink-2 hover:bg-surface hover:text-ink flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors"
        >
          <span>Show all calendars</span>
          <ChevronRight
            className={cn("h-4 w-4 transition-transform", popoverOpen && "rotate-90")}
          />
        </button>
      </div>
    </aside>
  );
}
