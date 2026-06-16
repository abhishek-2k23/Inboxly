"use client";

import type { EmailSummary } from "@repo/shared";
import {
  avatarColor,
  cn,
  emailPriority,
  initials,
  isUnread,
  PRIORITY_COLOR,
  relativeTime,
  senderName,
} from "@/lib/ui";

/** A single inbox row: avatar, sender, subject, snippet, time and priority. */
export function EmailRow({
  email,
  active,
  onSelect,
}: {
  email: EmailSummary;
  active: boolean;
  onSelect: (email: EmailSummary) => void;
}) {
  const unread = isUnread(email);
  const priority = emailPriority(email);
  const name = senderName(email.from);
  const subject = email.subject?.trim() || "(no subject)";

  return (
    <button
      type="button"
      onClick={() => onSelect(email)}
      className={cn(
        "group relative flex w-full items-start gap-3 px-5 py-3 text-left transition-colors",
        active ? "bg-surface" : "hover:bg-surface-hover",
      )}
    >
      {/* Unread accent bar */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-full transition-opacity",
          unread ? "bg-accent opacity-100" : "opacity-0",
        )}
      />

      {/* Avatar */}
      <span
        aria-hidden
        className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-[0.7rem] font-semibold text-white"
        style={{ backgroundColor: avatarColor(name) }}
      >
        {initials(name)}
      </span>

      {/* Content */}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-sm",
              unread ? "text-ink font-semibold" : "text-ink font-medium",
            )}
          >
            {name}
          </span>
          {priority !== "none" && (
            <span
              aria-hidden
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: PRIORITY_COLOR[priority] }}
            />
          )}
          <span className="text-ink-3 shrink-0 text-xs tabular-nums">
            {relativeTime(email.internalDate)}
          </span>
        </span>

        <span
          className={cn(
            "mt-0.5 block truncate text-sm",
            unread ? "text-ink font-medium" : "text-ink-2",
          )}
        >
          {subject}
        </span>

        {email.snippet && (
          <span className="text-ink-3 mt-0.5 block truncate text-xs leading-relaxed">
            {email.snippet}
          </span>
        )}
      </span>
    </button>
  );
}
