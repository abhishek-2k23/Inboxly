"use client";

import { useState } from "react";
import { calendarTitle, stepAnchor, type CalendarView } from "@/lib/calendar-utils";

/** View + anchor-date navigation state for the calendar page. */
export function useCalendarNav(initialView: CalendarView = "week") {
  const [view, setView] = useState<CalendarView>(initialView);
  const [anchor, setAnchor] = useState(() => new Date());

  function step(dir: number) {
    setAnchor((d) => stepAnchor(d, view, dir));
  }

  function goToday() {
    setAnchor(new Date());
  }

  return {
    view,
    setView,
    anchor,
    setAnchor,
    step,
    goToday,
    title: calendarTitle(view, anchor),
  };
}
