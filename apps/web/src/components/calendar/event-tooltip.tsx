"use client";

import type { CalendarEventSummary } from "@repo/shared";
import { cn, eventStart, formatEventRange, isAllDay } from "@/lib/ui";
import { eventLinks } from "@/lib/calendar-utils";

/** Hover card with invite details. Interactive so its links can be clicked. */
export function EventTooltip({ event }: { event: CalendarEventSummary }) {
  const start = eventStart(event);
  const dateLabel = start
    ? start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    : "";
  const timeLabel = isAllDay(event) ? "All day" : formatEventRange(event);
  const attendees = event.attendees ?? [];
  const organizer = event.organizer?.displayName || event.organizer?.email;
  const description = event.description
    ? event.description
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : "";
  const links = eventLinks(event);

  return (
    <span
      className="bg-panel hairline absolute left-1/2 top-full z-50 hidden w-64 -translate-x-1/2 flex-col gap-1.5 rounded-[var(--radius-card)] p-3 text-left shadow-lg group-hover/event:flex"
      role="tooltip"
    >
      <span className="text-ink text-xs font-medium leading-snug">
        {event.summary || "(no title)"}
      </span>

      <span className="text-ink-2 flex items-center gap-1.5 text-[11px]">
        <i className="ti ti-clock text-ink-3" aria-hidden />
        <span className="truncate">
          {dateLabel}
          {timeLabel && ` · ${timeLabel}`}
        </span>
      </span>

      {event.location && (
        <span className="text-ink-2 flex items-center gap-1.5 text-[11px]">
          <i className="ti ti-map-pin text-ink-3" aria-hidden />
          <span className="truncate">{event.location}</span>
        </span>
      )}

      {organizer && (
        <span className="text-ink-2 flex items-center gap-1.5 text-[11px]">
          <i className="ti ti-user text-ink-3" aria-hidden />
          <span className="truncate">{organizer}</span>
        </span>
      )}

      {attendees.length > 0 && (
        <span className="text-ink-2 flex items-start gap-1.5 text-[11px]">
          <i className="ti ti-users text-ink-3 mt-0.5" aria-hidden />
          <span className="line-clamp-2">
            {attendees.length} guest{attendees.length === 1 ? "" : "s"}
            {": "}
            {attendees
              .slice(0, 3)
              .map((a) => a.displayName || a.email)
              .filter(Boolean)
              .join(", ")}
            {attendees.length > 3 ? "…" : ""}
          </span>
        </span>
      )}

      {description && <span className="text-ink-3 line-clamp-3 text-[11px]">{description}</span>}

      {links.length > 0 && (
        <span className="hairline-t flex items-center gap-3 pt-2">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-accent-light flex items-center gap-1 text-[11px] hover:underline"
            >
              <i className={cn("ti", link.icon)} aria-hidden />
              {link.label}
            </a>
          ))}
        </span>
      )}
    </span>
  );
}
