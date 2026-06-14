import { create } from "zustand";
import type { CalendarEventSummary } from "@repo/shared";
import { listCalendarEvents } from "@/lib/api";

interface CalendarState {
  events: CalendarEventSummary[];
  loaded: boolean;
  loadEvents: () => Promise<void>;
}

let inFlight: Promise<void> | null = null;

/**
 * Shared calendar event cache, used by both the full calendar page and the
 * inbox "today" sidebar so they stay in sync without separate fetches.
 */
export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  loaded: false,

  loadEvents: async () => {
    if (inFlight) return inFlight;
    inFlight = (async () => {
      try {
        const { events } = await listCalendarEvents({ limit: 250 });
        set({ events, loaded: true });
      } catch {
        if (!get().loaded) set({ loaded: true });
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  },
}));
