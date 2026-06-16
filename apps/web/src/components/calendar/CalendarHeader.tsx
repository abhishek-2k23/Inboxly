"use client";

import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import type { CalendarView } from "@/lib/calendar-utils";
import { cn } from "@/lib/ui";

const VIEWS: CalendarView[] = ["day", "week", "month"];

/** Top bar: Today/prev/next + title on the left, Day/Week/Month switch + sync + New event on the right. */
export function CalendarHeader({
  title,
  view,
  onViewChange,
  onToday,
  onStep,
  isSyncing,
  onSync,
  onCreate,
}: {
  title: string;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onToday: () => void;
  onStep: (dir: number) => void;
  isSyncing: boolean;
  onSync: () => void;
  onCreate: () => void;
}) {
  return (
    <header className="border-line flex h-16 shrink-0 items-center justify-between gap-3 border-b px-5">
      {/* Left: today + arrows + date title */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onToday}
          className="border-line text-ink hover:bg-surface-hover hover:border-line-strong h-9 shrink-0 rounded-lg border px-3.5 text-sm font-medium transition-colors"
        >
          Today
        </button>
        <div className="border-line bg-surface/60 flex shrink-0 items-center rounded-lg border p-0.5">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => onStep(-1)}
            className="text-ink-2 hover:bg-panel hover:text-ink grid h-8 w-8 place-items-center rounded-md transition-colors"
          >
            <ChevronLeft className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => onStep(1)}
            className="text-ink-2 hover:bg-panel hover:text-ink grid h-8 w-8 place-items-center rounded-md transition-colors"
          >
            <ChevronRight className="h-[18px] w-[18px]" />
          </button>
        </div>
        <h1 className="text-ink truncate text-lg font-semibold tracking-tight">{title}</h1>
      </div>

      {/* Right: view switch + sync + new event */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="border-line bg-surface/60 flex items-center gap-0.5 rounded-lg border p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onViewChange(v)}
              className={cn(
                "h-8 rounded-md px-3.5 text-sm font-medium capitalize transition-all",
                v === view
                  ? "bg-panel text-ink ring-line shadow-sm ring-1"
                  : "text-ink-3 hover:text-ink",
              )}
            >
              {v}
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label="Sync calendar"
          title="Sync calendar"
          onClick={onSync}
          disabled={isSyncing}
          className="text-ink-2 hover:bg-surface hover:text-ink grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-[18px] w-[18px]", isSyncing && "animate-spin")} />
        </button>

        <button
          type="button"
          onClick={onCreate}
          className="bg-accent text-accent-ink hover:bg-accent-light inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-4 text-sm font-medium shadow-sm transition-all hover:shadow-[0_6px_18px_-6px_var(--color-glow)]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New event
        </button>
      </div>
    </header>
  );
}
