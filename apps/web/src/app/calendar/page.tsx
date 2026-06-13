"use client";

import { Show, useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import type { CalendarEventSearchResult, CalendarEventSummary } from "@repo/shared";
import { listCalendarEvents, searchCalendarEvents, subscribeToCalendarUpdates, syncCalendar } from "@/lib/api";

const LIST_LIMIT = 100;

export default function CalendarPage() {
  const { isSignedIn } = useUser();
  const [events, setEvents] = useState<CalendarEventSummary[]>([]);
  const [results, setResults] = useState<CalendarEventSearchResult[] | null>(null);
  const [query, setQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { events: loaded } = await listCalendarEvents({ limit: LIST_LIMIT });
      setEvents(loaded);
    } catch {
      setError("Failed to load calendar events.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void handleLoad();
  }, [handleLoad]);

  useEffect(() => {
    if (!isSignedIn) return;
    return subscribeToCalendarUpdates(() => {
      void handleLoad();
    });
  }, [isSignedIn, handleLoad]);

  async function handleSync() {
    setIsSyncing(true);
    setError(null);
    setStatus(null);
    try {
      const result = await syncCalendar();
      setStatus(`Synced ${result.synced} events, embedded ${result.embedded}.`);
      await handleLoad();
    } catch {
      setError("Failed to sync calendar. Is apps/api running and Google Calendar connected?");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || isSearching) return;

    setIsSearching(true);
    setError(null);
    try {
      const { results: found } = await searchCalendarEvents(trimmed);
      setResults(found);
    } catch {
      setError("Failed to search calendar events.");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-16">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Calendar Search</h1>
        <p className="text-sm text-slate-400">Sync cached Google Calendar events and test semantic search.</p>
      </header>

      <Show when="signed-in">
        <section className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {isSyncing ? "Syncing..." : "Sync Calendar"}
            </button>
            <button
              type="button"
              onClick={() => void handleLoad()}
              disabled={isLoading}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium transition hover:border-slate-500 disabled:opacity-50"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {status && <p className="text-sm text-emerald-400">{status}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search events by meaning..."
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </form>

          {results && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-slate-400">Search results ({results.length}):</p>
              {results.length === 0 && <p className="text-sm text-slate-500">No matches found.</p>}
              {results.map((event) => (
                <EventCard key={event.id} event={event} similarity={event.similarity} />
              ))}
            </div>
          )}

          {!results && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-slate-400">Upcoming events ({events.length}):</p>
              {events.length === 0 && !isLoading && (
                <p className="text-sm text-slate-500">
                  No cached events yet. Click &quot;Sync Calendar&quot; to fetch your schedule.
                </p>
              )}
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </Show>
    </main>
  );
}

function formatEventTime(event: CalendarEventSummary): string {
  const start = event.start?.dateTime ?? event.start?.date;
  const end = event.end?.dateTime ?? event.end?.date;
  if (!start) return "";
  return end ? `${start} – ${end}` : start;
}

function EventCard({ event, similarity }: { event: CalendarEventSummary; similarity?: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-slate-100">{event.summary || "(no title)"}</p>
        {similarity !== undefined && (
          <span className="shrink-0 rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
            {(similarity * 100).toFixed(1)}% match
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500">{formatEventTime(event)}</p>
      {event.location && <p className="text-xs text-slate-500">Location: {event.location}</p>}
      {event.description && <p className="text-slate-400">{event.description}</p>}
    </div>
  );
}
