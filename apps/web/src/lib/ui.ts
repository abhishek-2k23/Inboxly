import type { CalendarEventSummary, EmailSummary } from "@repo/shared";

/** Tiny classname joiner (no clsx dependency). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export type Priority = "urgent" | "medium" | "low" | "none";

export const PRIORITY_COLOR: Record<Priority, string> = {
  urgent: "var(--color-prio-urgent)",
  medium: "var(--color-prio-medium)",
  low: "var(--color-prio-low)",
  none: "var(--color-prio-none)",
};

/**
 * Derives a priority signal from Gmail label ids, since the backend doesn't
 * expose an explicit priority. IMPORTANT → urgent, primary/personal → medium,
 * promotions/social → low, everything else → none.
 */
export function emailPriority(email: EmailSummary): Priority {
  const labels = email.labelIds ?? [];
  if (labels.includes("IMPORTANT")) return "urgent";
  if (labels.includes("CATEGORY_PERSONAL") || labels.includes("CATEGORY_PRIMARY")) return "medium";
  if (
    labels.includes("CATEGORY_PROMOTIONS") ||
    labels.includes("CATEGORY_SOCIAL") ||
    labels.includes("CATEGORY_UPDATES")
  )
    return "low";
  return "none";
}

export function isUnread(email: EmailSummary): boolean {
  return (email.labelIds ?? []).includes("UNREAD");
}

export type InboxCategory = "All" | "Primary" | "Urgent" | "Updates" | "Promotions";

export const INBOX_CATEGORIES: InboxCategory[] = [
  "All",
  "Primary",
  "Urgent",
  "Updates",
  "Promotions",
];

export function matchesCategory(email: EmailSummary, category: InboxCategory): boolean {
  const labels = email.labelIds ?? [];
  switch (category) {
    case "All":
      return true;
    case "Primary":
      return labels.includes("CATEGORY_PERSONAL") || labels.includes("CATEGORY_PRIMARY");
    case "Urgent":
      return labels.includes("IMPORTANT");
    case "Updates":
      return labels.includes("CATEGORY_UPDATES") || labels.includes("CATEGORY_FORUMS");
    case "Promotions":
      return labels.includes("CATEGORY_PROMOTIONS") || labels.includes("CATEGORY_SOCIAL");
  }
}

/** Pulls a human display name out of a raw `From` header. */
export function senderName(from?: string): string {
  if (!from) return "Unknown";
  const match = from.match(/^\s*"?([^"<]+?)"?\s*<.*>/);
  if (match?.[1]?.trim()) return match[1].trim();
  const emailMatch = from.match(/<?([^<>\s]+@[^<>\s]+)>?/);
  if (emailMatch?.[1]) return emailMatch[1];
  return from.trim();
}

/** Pulls the bare email address out of a raw `From`/`To` header. */
export function senderEmail(from?: string): string {
  if (!from) return "";
  const match = from.match(/<([^<>]+)>/);
  if (match?.[1]) return match[1].trim();
  const bare = from.match(/[^<>\s]+@[^<>\s]+/);
  return bare?.[0] ?? from.trim();
}

export function initials(name: string): string {
  const parts = name
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0];
  if (!first) return "?";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1] ?? first;
  return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase() || "?";
}

/** Deterministic accent-tinted avatar background derived from a string. */
export function avatarColor(seed: string): string {
  const palette = ["#1d9e75", "#3a7bd5", "#9b59b6", "#e08e3c", "#c0504d", "#2c8c84"];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return palette[Math.abs(hash) % palette.length] ?? "#1d9e75";
}

/** Compact, human relative timestamp for inbox rows. */
export function relativeTime(internalDate?: string | null): string {
  if (!internalDate) return "";
  const ts = Number(internalDate);
  if (!Number.isFinite(ts)) return "";
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 7) return date.toLocaleDateString(undefined, { weekday: "short" });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Absolute date + time for inbox rows and the email detail header, e.g. "Today, 2:45 PM" or "Jun 12, 2:45 PM". */
export function emailTimestamp(internalDate?: string | null): string {
  if (!internalDate) return "";
  const ts = Number(internalDate);
  if (!Number.isFinite(ts)) return "";
  const date = new Date(ts);
  const now = new Date();
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  if (date.toDateString() === now.toDateString()) return `Today, ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;

  const dateStr = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
  return `${dateStr}, ${time}`;
}

export function eventStart(event: CalendarEventSummary): Date | null {
  const raw = event.start?.dateTime ?? event.start?.date;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function eventEnd(event: CalendarEventSummary): Date | null {
  const raw = event.end?.dateTime ?? event.end?.date;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isAllDay(event: CalendarEventSummary): boolean {
  return Boolean(event.start?.date && !event.start?.dateTime);
}

export function formatEventRange(event: CalendarEventSummary): string {
  const start = eventStart(event);
  if (!start) return "";
  if (isAllDay(event)) {
    return start.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " · All day";
  }
  const end = eventEnd(event);
  const startStr = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (!end) return startStr;
  const endStr = end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${startStr} – ${endStr}`;
}
