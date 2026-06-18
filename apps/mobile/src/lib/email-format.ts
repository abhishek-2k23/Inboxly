import type { EmailSummary } from "@/types";

export function isUnread(e: EmailSummary): boolean {
  return (e.labelIds ?? []).includes("UNREAD");
}

export type Priority = "urgent" | "medium" | "low";

export function priority(e: EmailSummary): Priority {
  const l = e.labelIds ?? [];
  if (l.includes("IMPORTANT")) return "urgent";
  if (l.includes("CATEGORY_PERSONAL") || l.includes("CATEGORY_PRIMARY")) return "medium";
  return "low";
}

export function senderName(from?: string): string {
  if (!from) return "Unknown";
  const m = from.match(/^\s*"?([^"<]+?)"?\s*</);
  return m?.[1]?.trim() ?? from.split("@")[0] ?? from;
}

export function senderEmail(from?: string): string {
  if (!from) return "";
  const m = from.match(/<([^>]+)>/);
  return m?.[1]?.trim() ?? from.trim();
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "").toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

const AVATAR_PALETTE = ["#1d9e75", "#3a7bd5", "#9b59b6", "#e08e3c", "#c0504d", "#2c8c84"];

export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]!;
}

export function relTime(internalDate?: string | null): string {
  if (!internalDate) return "";
  const ts = Number(internalDate);
  if (!isFinite(ts)) return "";
  const diff = Date.now() - ts;
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

export function fullDate(internalDate?: string | null): string {
  if (!internalDate) return "";
  const ts = Number(internalDate);
  if (!isFinite(ts)) return "";
  return new Date(ts).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Strips tags/entities from an HTML body for a plain-text fallback render. */
export function htmlToText(html?: string): string {
  if (!html) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(p|div|br|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
