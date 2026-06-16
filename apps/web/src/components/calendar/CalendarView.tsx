"use client";

import { useState } from "react";
import type { CalendarEventSummary } from "@repo/shared";
import { useCalendarActions } from "@/hooks/use-calendar-actions";
import { useCalendarEvents } from "@/hooks/use-calendar-events";
import { useCalendarNav } from "@/hooks/use-calendar-nav";
import { buildWeekGrid } from "@/lib/calendar-utils";
import { CalendarHeader } from "./CalendarHeader";
import { CreateEventModal } from "./CreateEventModal";
import { EventDetailModal } from "./EventDetailModal";
import { MonthView } from "./MonthView";
import { TimeGridView } from "./TimeGridView";

/** Full calendar page: Day/Week/Month views, navigation, hover/click event details, and event creation. */
export function CalendarView() {
  const { byDay, loaded } = useCalendarEvents();
  const { view, setView, anchor, step, goToday, title } = useCalendarNav("week");
  const { isSyncing, handleSync, handleCreate, isDeleting, handleDelete } = useCalendarActions();

  const [selectedEvent, setSelectedEvent] = useState<CalendarEventSummary | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const days = view === "day" ? [anchor] : view === "week" ? buildWeekGrid(anchor) : [];

  async function onDelete(event: CalendarEventSummary) {
    await handleDelete(event.id, event.summary);
    setSelectedEvent(null);
  }

  return (
    <div className="flex h-full flex-col">
      <CalendarHeader
        title={title}
        view={view}
        onViewChange={setView}
        onToday={goToday}
        onStep={step}
        isSyncing={isSyncing}
        onSync={handleSync}
        onCreate={() => setCreateOpen(true)}
      />

      <div className="min-h-0 flex-1">
        {!loaded ? (
          <div className="grid h-full place-items-center">
            <div className="text-ink-3 text-sm">Loading your calendar…</div>
          </div>
        ) : view === "month" ? (
          <MonthView anchor={anchor} byDay={byDay} onSelectEvent={setSelectedEvent} />
        ) : (
          <TimeGridView days={days} byDay={byDay} onSelectEvent={setSelectedEvent} />
        )}
      </div>

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onDelete={onDelete}
        isDeleting={isDeleting}
      />

      <CreateEventModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
        defaultDate={anchor}
      />
    </div>
  );
}
