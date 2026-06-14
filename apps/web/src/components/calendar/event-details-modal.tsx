"use client";

import type { CalendarEventSummary } from "@repo/shared";
import { cn, eventStart, formatEventRange, isAllDay } from "@/lib/ui";
import { eventLinks } from "@/lib/calendar-utils";
import { IconButton } from "@/components/ui";

/** Click-to-open modal with full invite details and links to Google Calendar/Meet. */
export function EventDetailsModal({
  event,
  onClose,
}: {
  event: CalendarEventSummary;
  onClose: () => void;
}) {
  const start = eventStart(event);
  const dateLabel = start
    ? start.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-panel hairline flex w-full max-w-sm flex-col gap-3 rounded-[var(--radius-card)] p-5"
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-ink flex items-center gap-2 text-sm font-medium">
            <i className="ti ti-calendar-event text-accent-light" aria-hidden />
            {event.summary || "(no title)"}
          </h2>
          <IconButton icon="ti-x" label="Close" size="sm" onClick={onClose} />
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <div className="text-ink-2 flex items-center gap-2">
            <i className="ti ti-clock text-ink-3" aria-hidden />
            <span>
              {dateLabel}
              {timeLabel && ` · ${timeLabel}`}
            </span>
          </div>

          {event.location && (
            <div className="text-ink-2 flex items-center gap-2">
              <i className="ti ti-map-pin text-ink-3" aria-hidden />
              <span>{event.location}</span>
            </div>
          )}

          {organizer && (
            <div className="text-ink-2 flex items-center gap-2">
              <i className="ti ti-user text-ink-3" aria-hidden />
              <span>Organized by {organizer}</span>
            </div>
          )}

          {attendees.length > 0 && (
            <div className="text-ink-2 flex items-start gap-2">
              <i className="ti ti-users text-ink-3 mt-0.5" aria-hidden />
              <div className="flex min-w-0 flex-col gap-0.5">
                {attendees.map((a) => (
                  <span key={a.email ?? a.displayName} className="truncate">
                    {a.displayName || a.email}
                    {a.organizer ? " (organizer)" : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          {description && (
            <p className="text-ink-3 whitespace-pre-wrap break-words text-xs leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {links.length > 0 && (
          <div className="hairline-t flex items-center gap-2 pt-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-light hover:bg-surface-hover flex items-center gap-1.5 rounded-[var(--radius-ctl)] px-2 py-1 text-xs transition-colors"
              >
                <i className={cn("ti", link.icon)} aria-hidden />
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
