import { create } from "zustand";
import type { CalendarEventSummary } from "@/types";
import { listCalendarEvents } from "@/lib/api";

interface CalendarState {
  events: CalendarEventSummary[];
  loaded: boolean;
  loadEvents: () => Promise<void>;
}

let inFlight: Promise<void> | null = null;

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
