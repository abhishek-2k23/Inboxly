"use client";

import { useEffect, useMemo } from "react";
import type { CalendarEventSummary } from "@repo/shared";
import { subscribeToCalendarUpdates } from "@/lib/api";
import { eventStart } from "@/lib/ui";
import { groupByDay } from "@/lib/calendar-utils";
import { useCalendarStore } from "@/stores/calendar-store";
import { useAuth } from "@/hooks/use-auth";

/**
 * Loads the shared calendar event cache on mount and keeps it fresh via SSE
 * while signed in. Used by both the full calendar page and the inbox "today"
 * sidebar so they share one fetch.
 */
export function useCalendarEvents() {
  const events = useCalendarStore((s) => s.events);
  const loaded = useCalendarStore((s) => s.loaded);
  const loadEvents = useCalendarStore((s) => s.loadEvents);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!isSignedIn) return;
    return subscribeToCalendarUpdates(() => void loadEvents());
  }, [isSignedIn, loadEvents]);

  const byDay = useMemo(() => groupByDay(events, eventStart), [events]);

  return { events, loaded, byDay, loadEvents } as {
    events: CalendarEventSummary[];
    loaded: boolean;
    byDay: Map<string, CalendarEventSummary[]>;
    loadEvents: () => Promise<void>;
  };
}
