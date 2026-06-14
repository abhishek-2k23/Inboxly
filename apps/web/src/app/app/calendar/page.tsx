"use client";

import { useState } from "react";
import type { CalendarEventSummary } from "@repo/shared";
import { CalendarSkeleton } from "@/components/calendar/calendar-skeleton";
import { DayView } from "@/components/calendar/day-view";
import { EventDetailsModal } from "@/components/calendar/event-details-modal";
import { MonthView } from "@/components/calendar/month-view";
import { QuickCreate } from "@/components/calendar/quick-create";
import { ViewToggle } from "@/components/calendar/view-toggle";
import { WeekView } from "@/components/calendar/week-view";
import { useCalendarActions } from "@/hooks/use-calendar-actions";
import { useCalendarEvents } from "@/hooks/use-calendar-events";
import { useCalendarNav } from "@/hooks/use-calendar-nav";
import { PromptBar } from "@/components/prompt-bar";
import { IconButton } from "@/components/ui";

const SUGGESTIONS = [
  "Schedule a 30-min sync tomorrow at 2 PM",
  "Block focus time Friday morning",
  "Invite the team to a review Thursday 4 PM",
  "What's on my calendar this week?",
];

export default function CalendarPage() {
  const { loaded, byDay, loadEvents } = useCalendarEvents();
  const { view, setView, anchor, setAnchor, step, goToday, title } = useCalendarNav();
  const { isSyncing, handleSync, handleCreate } = useCalendarActions();
  const [quickCreate, setQuickCreate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventSummary | null>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="bg-page hairline-b shrink-0 px-6 pb-3 pt-5">
        <PromptBar
          suggestions={SUGGESTIONS}
          onActivity={() => void loadEvents()}
          placeholder="Add to your calendar — just type it…"
        />
      </div>

      <header className="flex shrink-0 flex-wrap items-center gap-3 px-6 py-3">
        <div className="flex items-center gap-1">
          <IconButton icon="ti-chevron-left" label="Previous" onClick={() => step(-1)} />
          <IconButton icon="ti-chevron-right" label="Next" onClick={() => step(1)} />
          <button
            type="button"
            onClick={goToday}
            className="text-ink-2 hairline hover:text-ink ml-1 rounded-[var(--radius-ctl)] px-3 py-1.5 text-xs transition-colors"
          >
            Today
          </button>
        </div>
        <h1 className="text-ink text-base font-medium">{title}</h1>

        <div className="ml-auto flex items-center gap-1">
          <div className="bg-surface hairline flex items-center gap-0.5 rounded-[var(--radius-ctl)] p-0.5">
            <ViewToggle
              icon="ti-calendar-event"
              label="Day"
              active={view === "day"}
              onClick={() => setView("day")}
            />
            <ViewToggle
              icon="ti-calendar-week"
              label="Week"
              active={view === "week"}
              onClick={() => setView("week")}
            />
            <ViewToggle
              icon="ti-calendar-month"
              label="Month"
              active={view === "month"}
              onClick={() => setView("month")}
            />
          </div>
          <IconButton
            icon="ti-refresh"
            label="Sync calendar"
            onClick={handleSync}
            disabled={isSyncing}
          />
          <IconButton
            icon="ti-plus"
            label="New event"
            accent
            onClick={() => setQuickCreate(anchor)}
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto px-6 pb-16">
        {!loaded && <CalendarSkeleton view={view} />}
        {loaded && view === "week" && (
          <WeekView
            anchor={anchor}
            byDay={byDay}
            onPick={setQuickCreate}
            onSelectEvent={setSelectedEvent}
          />
        )}
        {loaded && view === "day" && (
          <DayView
            anchor={anchor}
            byDay={byDay}
            onPick={setQuickCreate}
            onSelectEvent={setSelectedEvent}
          />
        )}
        {loaded && view === "month" && (
          <MonthView
            anchor={anchor}
            byDay={byDay}
            onPick={(d) => {
              setAnchor(d);
              setQuickCreate(d);
            }}
            onSelectEvent={setSelectedEvent}
          />
        )}
      </div>

      {quickCreate && (
        <QuickCreate
          date={quickCreate}
          onClose={() => setQuickCreate(null)}
          onCreate={handleCreate}
        />
      )}

      {selectedEvent && (
        <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
