"use client";

import type { CalendarView } from "@/lib/calendar-utils";

export function CalendarSkeleton({ view }: { view: CalendarView }) {
  if (view === "day") {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-12 rounded-[var(--radius-ctl)]" />
        ))}
      </div>
    );
  }
  if (view === "month") {
    return (
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 42 }).map((_, i) => (
          <div key={i} className="skeleton min-h-[92px] rounded-[var(--radius-ctl)]" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex min-h-[60vh] flex-col gap-2 rounded-[var(--radius-card)] p-2">
          <div className="skeleton h-6 rounded" />
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="skeleton h-10 rounded-[var(--radius-ctl)]" />
          ))}
        </div>
      ))}
    </div>
  );
}
