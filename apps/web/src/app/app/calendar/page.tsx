"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CalendarEventInput, CalendarEventSummary } from "@repo/shared";
import {
  createCalendarEvent,
  listCalendarEvents,
  subscribeToCalendarUpdates,
  syncCalendar,
} from "@/lib/api";
import { cn, eventStart, formatEventRange, isAllDay } from "@/lib/ui";
import { PromptBar } from "@/components/prompt-bar";
import { IconButton } from "@/components/ui";

type View = "day" | "week" | "month";

const DAY_MS = 86400000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}
function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}
function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS);
}

const SUGGESTIONS = [
  "Schedule a 30-min sync tomorrow at 2 PM",
  "Block focus time Friday morning",
  "Invite the team to a review Thursday 4 PM",
  "What's on my calendar this week?",
];

export default function CalendarPage() {
  const { isSignedIn } = useUser();
  const [events, setEvents] = useState<CalendarEventSummary[]>([]);
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [quickCreate, setQuickCreate] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const { events: e } = await listCalendarEvents({ limit: 250 });
      setEvents(e);
    } catch {
      /* keep prior */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isSignedIn) return;
    return subscribeToCalendarUpdates(() => void load());
  }, [isSignedIn, load]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEventSummary[]>();
    for (const e of events) {
      const s = eventStart(e);
      if (!s) continue;
      const key = s.toDateString();
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    for (const list of map.values())
      list.sort((a, b) => (eventStart(a)?.getTime() ?? 0) - (eventStart(b)?.getTime() ?? 0));
    return map;
  }, [events]);

  function step(dir: number) {
    if (view === "day") setAnchor((d) => addDays(d, dir));
    else if (view === "week") setAnchor((d) => addDays(d, dir * 7));
    else {
      setAnchor((d) => {
        const x = new Date(d);
        x.setMonth(x.getMonth() + dir);
        return x;
      });
    }
  }

  async function handleSync() {
    setIsSyncing(true);
    try {
      await syncCalendar();
      await load();
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleCreate(input: CalendarEventInput) {
    await createCalendarEvent(input);
    setQuickCreate(null);
    await load();
  }

  const title =
    view === "month"
      ? anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : view === "day"
        ? anchor.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
        : `${startOfWeek(anchor).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${addDays(startOfWeek(anchor), 6).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  return (
    <div className="flex h-full flex-col">
      <div className="bg-page hairline-b shrink-0 px-6 pb-3 pt-5">
        <PromptBar
          suggestions={SUGGESTIONS}
          onActivity={() => void load()}
          placeholder="Add to your calendar — just type it…"
        />
      </div>

      <header className="flex shrink-0 flex-wrap items-center gap-3 px-6 py-3">
        <div className="flex items-center gap-1">
          <IconButton icon="ti-chevron-left" label="Previous" onClick={() => step(-1)} />
          <IconButton icon="ti-chevron-right" label="Next" onClick={() => step(1)} />
          <button
            type="button"
            onClick={() => setAnchor(new Date())}
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
        {view === "week" && <WeekView anchor={anchor} byDay={byDay} onPick={setQuickCreate} />}
        {view === "day" && <DayView anchor={anchor} byDay={byDay} onPick={setQuickCreate} />}
        {view === "month" && (
          <MonthView
            anchor={anchor}
            byDay={byDay}
            onPick={(d) => {
              setAnchor(d);
              setQuickCreate(d);
            }}
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
    </div>
  );
}

function ViewToggle({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-xs transition-colors",
        active ? "bg-accent-fill text-accent-light" : "text-ink-2 hover:text-ink",
      )}
    >
      <i className={cn("ti", icon)} aria-hidden />
      {label}
    </button>
  );
}

function EventBlock({ event, accent = false }: { event: CalendarEventSummary; accent?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-ctl)] px-2 py-1.5 text-left transition-colors",
        accent
          ? "bg-accent-fill text-accent-light"
          : "bg-surface text-ink hairline hover:border-accent",
      )}
    >
      <p className="truncate text-xs font-medium">{event.summary || "(no title)"}</p>
      <p className="truncate text-[11px] opacity-80">
        {isAllDay(event) ? "All day" : formatEventRange(event)}
      </p>
    </div>
  );
}

function WeekView({
  anchor,
  byDay,
  onPick,
}: {
  anchor: Date;
  byDay: Map<string, CalendarEventSummary[]>;
  onPick: (d: Date) => void;
}) {
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const today = new Date();
  return (
    <div className="grid min-h-full grid-cols-7 gap-2">
      {days.map((d) => {
        const isToday = sameDay(d, today);
        const list = byDay.get(d.toDateString()) ?? [];
        return (
          <div
            key={d.toISOString()}
            className={cn(
              "hairline flex min-h-[60vh] flex-col rounded-[var(--radius-card)] p-2",
              isToday ? "bg-panel" : "bg-page",
            )}
          >
            <button
              type="button"
              onClick={() => onPick(d)}
              className="hover:bg-surface mb-2 flex items-center justify-between rounded-[var(--radius-ctl)] px-1 py-1 text-left transition-colors"
            >
              <span className="text-ink-3 text-xs">{WEEKDAYS[d.getDay()]}</span>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isToday ? "bg-accent text-accent-ink" : "text-ink",
                )}
              >
                {d.getDate()}
              </span>
            </button>
            <div className="flex flex-col gap-1.5">
              {list.map((e, i) => (
                <EventBlock key={e.id} event={e} accent={isToday && i === 0} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({
  anchor,
  byDay,
  onPick,
}: {
  anchor: Date;
  byDay: Map<string, CalendarEventSummary[]>;
  onPick: (d: Date) => void;
}) {
  const list = byDay.get(anchor.toDateString()) ?? [];
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-2">
      {list.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <i className="ti ti-calendar-off text-ink-3 text-3xl" aria-hidden />
          <p className="text-ink-2 text-sm">Nothing scheduled.</p>
          <button
            type="button"
            onClick={() => onPick(anchor)}
            className="text-accent-light text-xs hover:underline"
          >
            Create an event
          </button>
        </div>
      )}
      {list.map((e, i) => (
        <button key={e.id} type="button" onClick={() => onPick(anchor)} className="text-left">
          <EventBlock event={e} accent={i === 0 && sameDay(anchor, new Date())} />
        </button>
      ))}
    </div>
  );
}

function MonthView({
  anchor,
  byDay,
  onPick,
}: {
  anchor: Date;
  byDay: Map<string, CalendarEventSummary[]>;
  onPick: (d: Date) => void;
}) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(first);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const today = new Date();
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-ink-3 px-2 py-1 text-center text-xs">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d) => {
          const inMonth = d.getMonth() === anchor.getMonth();
          const isToday = sameDay(d, today);
          const list = byDay.get(d.toDateString()) ?? [];
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onPick(d)}
              className={cn(
                "hairline hover:border-accent flex min-h-[92px] flex-col gap-1 rounded-[var(--radius-ctl)] p-1.5 text-left transition-colors",
                inMonth ? "bg-page" : "bg-page/40",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center self-end rounded-full text-xs",
                  isToday ? "bg-accent text-accent-ink" : inMonth ? "text-ink-2" : "text-ink-3",
                )}
              >
                {d.getDate()}
              </span>
              <div className="flex flex-col gap-0.5">
                {list.slice(0, 3).map((e) => (
                  <span
                    key={e.id}
                    className="bg-surface text-ink-2 truncate rounded px-1 py-0.5 text-[10px]"
                  >
                    {e.summary || "(no title)"}
                  </span>
                ))}
                {list.length > 3 && (
                  <span className="text-ink-3 text-[10px]">+{list.length - 3} more</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuickCreate({
  date,
  onClose,
  onCreate,
}: {
  date: Date;
  onClose: () => void;
  onCreate: (input: CalendarEventInput) => Promise<void>;
}) {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const [title, setTitle] = useState("");
  const [day, setDay] = useState(dateStr);
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(30);
  const [guests, setGuests] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Add a title.");
      return;
    }
    setSaving(true);
    setError(null);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const startDate = new Date(`${day}T${time}:00`);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    const toLocal = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;
    const attendees = guests
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean)
      .map((email) => ({ email }));
    try {
      await onCreate({
        summary: title.trim(),
        start: { dateTime: toLocal(startDate), timeZone },
        end: { dateTime: toLocal(endDate), timeZone },
        attendees: attendees.length ? attendees : undefined,
      });
    } catch {
      setError("Couldn't create the event. Is Google Calendar connected?");
      setSaving(false);
    }
  }

  const FIELD =
    "rounded-[var(--radius-ctl)] bg-page px-3 py-2 text-sm text-ink outline-none hairline placeholder:text-ink-3 focus:border-accent";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-panel hairline flex w-full max-w-sm flex-col gap-3 rounded-[var(--radius-card)] p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-ink flex items-center gap-2 text-sm font-medium">
            <i className="ti ti-calendar-plus text-accent-light" aria-hidden />
            New event
          </h2>
          <IconButton icon="ti-x" label="Close" size="sm" onClick={onClose} />
        </div>

        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          className={FIELD}
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className={cn(FIELD, "flex-1")}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={FIELD}
          />
        </div>
        <div className="text-ink-2 flex items-center gap-2 text-xs">
          <span>Duration</span>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={cn(FIELD, "flex-1")}
          >
            {[15, 30, 45, 60, 90, 120].map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
        </div>
        <input
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          placeholder="Guests (comma-separated emails)"
          className={FIELD}
        />
        {error && <p className="text-prio-urgent text-xs">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="bg-accent text-accent-ink hover:bg-accent-light flex items-center justify-center gap-2 rounded-[var(--radius-ctl)] px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <i className="ti ti-send" aria-hidden />
          {saving ? "Sending invite…" : "Send invite"}
        </button>
      </form>
    </div>
  );
}
