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
