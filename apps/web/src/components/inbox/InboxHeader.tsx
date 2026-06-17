"use client";

import { Plus, RefreshCw, Search, X } from "lucide-react";
import { cn } from "@/lib/ui";
import type { InboxTab } from "./tabs";
import { INBOX_TABS } from "./tabs";

/** Top header: centered pill search, filter tabs, sync and Compose actions. */
export function InboxHeader({
  query,
  onQueryChange,
  tab,
  onTabChange,
  onSync,
  isSyncing,
  onCompose,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  tab: InboxTab;
  onTabChange: (tab: InboxTab) => void;
  onSync: () => void;
  isSyncing: boolean;
  onCompose: () => void;
}) {
  return (
    <header className="border-line shrink-0 border-b">
      {/* Top row: search + actions */}
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="relative mx-auto w-full max-w-md">
          <Search className="text-ink-3 pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search mail"
            className="border-line bg-surface text-ink placeholder:text-ink-3 focus:border-line-strong focus:bg-panel h-10 w-full rounded-full border pl-10 pr-9 text-sm outline-none transition-colors"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onQueryChange("")}
              className="text-ink-3 hover:text-ink absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          aria-label="Sync inbox"
          title="Sync inbox"
          onClick={onSync}
          disabled={isSyncing}
          className="text-ink-2 hover:bg-surface hover:text-ink grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-[18px] w-[18px]", isSyncing && "animate-spin")} />
        </button>

        <button
          type="button"
          onClick={onCompose}
          className="bg-accent text-accent-ink hover:bg-accent-light inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Compose
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-4 pb-px">
        {INBOX_TABS.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onTabChange(t)}
              className={cn(
                "relative h-10 px-3 text-sm transition-colors",
                active ? "text-ink font-medium" : "text-ink-3 hover:text-ink-2",
              )}
            >
              {t}
              {active && (
                <span className="bg-accent absolute inset-x-3 -bottom-px h-0.5 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
