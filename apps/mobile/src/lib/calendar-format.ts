import type { CalendarEventSummary } from "@/types";

const ACCENT_PALETTE = ["#3a7bd5", "#1d9e75", "#6366f1", "#e08e3c", "#9b59b6", "#2c8c84"];

export function calendarColor(calendarId?: string): string {
  if (!calendarId) return ACCENT_PALETTE[0]!;
  let h = 0;
  for (let i = 0; i < calendarId.length; i++) h = (h * 31 + calendarId.charCodeAt(i)) | 0;
  return ACCENT_PALETTE[Math.abs(h) % ACCENT_PALETTE.length]!;
}

export function eventStart(e: CalendarEventSummary): Date | null {
  const raw = e.start?.dateTime ?? e.start?.date;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

export function eventEnd(e: CalendarEventSummary): Date | null {
  const raw = e.end?.dateTime ?? e.end?.date;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

export function isAllDay(e: CalendarEventSummary): boolean {
  return Boolean(e.start?.date && !e.start?.dateTime);
}

export function formatRange(e: CalendarEventSummary): string {
  const start = eventStart(e);
  if (!start) return "";
  if (isAllDay(e)) return "All day";
  const startStr = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const end = eventEnd(e);
  if (!end) return startStr;
  const endStr = end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${startStr} – ${endStr}`;
}

export function formatDay(d: Date): string {
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}
