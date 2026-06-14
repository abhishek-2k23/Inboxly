"use client";

import type { CalendarEventSummary } from "@repo/shared";
import { EventTooltip } from "@/components/calendar/event-tooltip";

/**
 * Wraps an event chip/block with click-to-open-details and a hover card.
 * `onClick` stops propagation so it doesn't also trigger a parent day cell's
 * "create new event" handler.
 */
export function EventEntry({
  event,
  onSelect,
  children,
}: {
  event: CalendarEventSummary;
  onSelect: (event: CalendarEventSummary) => void;
  children: React.ReactNode;
}) {
  return (
    <span
      className="group/event relative block cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(event);
      }}
    >
      {children}
      <EventTooltip event={event} />
    </span>
  );
}
