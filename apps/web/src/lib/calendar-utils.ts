import type { CalendarEventSummary } from "@repo/shared";

export type CalendarView = "day" | "week" | "month";

export const DAY_MS = 86400000;
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS);
}

/** Groups events by calendar day (`toDateString()`), each list sorted by start time. */
export function groupByDay(
  events: CalendarEventSummary[],
  eventStart: (e: CalendarEventSummary) => Date | null,
): Map<string, CalendarEventSummary[]> {
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
}

/** Display title for the calendar header, based on the current view + anchor date. */
export function calendarTitle(view: CalendarView, anchor: Date): string {
  if (view === "month") {
    return anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }
  if (view === "day") {
    return anchor.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  }
  const start = startOfWeek(anchor);
  const end = addDays(start, 6);
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

/** Steps the anchor date forward/backward by one unit of the current view. */
export function stepAnchor(anchor: Date, view: CalendarView, dir: number): Date {
  if (view === "day") return addDays(anchor, dir);
  if (view === "week") return addDays(anchor, dir * 7);
  const x = new Date(anchor);
  x.setMonth(x.getMonth() + dir);
  return x;
}

export interface EventLink {
  href: string;
  icon: string;
  label: string;
}

export function eventLinks(event: CalendarEventSummary): EventLink[] {
  const links: EventLink[] = [];
  if (event.hangoutLink)
    links.push({ href: event.hangoutLink, icon: "ti-video", label: "Join Meet" });
  if (event.htmlLink) links.push({ href: event.htmlLink, icon: "ti-external-link", label: "Open" });
  return links;
}

/** True when `d` falls in the same calendar month/year as `anchor`. */
export function isSameMonth(d: Date, anchor: Date): boolean {
  return d.getMonth() === anchor.getMonth() && d.getFullYear() === anchor.getFullYear();
}

/**
 * 42 consecutive days (6 full weeks) covering the month containing `anchor`,
 * starting on the Sunday on/before the 1st - the standard month-grid shape.
 * Because the grid is 7 columns wide, the flat index's parity alone produces
 * a true checkerboard (each row's starting parity flips), which is what
 * drives the odd/even cell background.
 */
export function buildMonthGrid(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** The 7 days (Sun-Sat) of the week containing `anchor`. */
export function buildWeekGrid(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Pixel height of one hour row in the day/week time grid. */
export const HOUR_HEIGHT = 64;

export const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function hourLabel(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

/** Minutes elapsed since local midnight for a given Date. */
export function minutesFromMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

export interface TimedLayout<T> {
  item: T;
  col: number;
  cols: number;
}

/**
 * Greedy column-packing for overlapping timed events on a single day, the
 * same approach most calendar UIs use: events are clustered by transitive
 * time overlap, each cluster gets columns assigned left-to-right by start
 * time, and every event in a cluster is stretched to that cluster's column
 * count so side-by-side events share the day's width evenly.
 */
export function layoutTimedEvents<T>(
  items: T[],
  getStart: (t: T) => number,
  getEnd: (t: T) => number,
): TimedLayout<T>[] {
  const sorted = [...items].sort((a, b) => getStart(a) - getStart(b) || getEnd(a) - getEnd(b));
  const result: TimedLayout<T>[] = [];

  let cluster: { item: T; col: number }[] = [];
  let colEnds: number[] = [];
  let clusterEnd = -Infinity;

  function flush() {
    if (cluster.length === 0) return;
    const maxCols = Math.max(...cluster.map((c) => c.col)) + 1;
    for (const c of cluster) result.push({ item: c.item, col: c.col, cols: maxCols });
    cluster = [];
    colEnds = [];
  }

  for (const item of sorted) {
    const start = getStart(item);
    const end = getEnd(item);
    if (start >= clusterEnd) {
      flush();
      clusterEnd = -Infinity;
    }
    let col = colEnds.findIndex((e) => e <= start);
    if (col === -1) col = colEnds.length;
    colEnds[col] = end;
    cluster.push({ item, col });
    clusterEnd = Math.max(clusterEnd, end);
  }
  flush();

  return result;
}
