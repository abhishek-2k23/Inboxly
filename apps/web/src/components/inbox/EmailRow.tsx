"use client";

import type { EmailSummary } from "@repo/shared";
import {
  avatarColor,
  cn,
  emailPriority,
  emailTimestamp,
  initials,
  isUnread,
  PRIORITY_COLOR,
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
  const isDraft = Boolean(email.draftId);
  const unread = isUnread(email);
  const priority = emailPriority(email);
  const name = isDraft ? senderName(email.to) || "No recipient" : senderName(email.from);
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
              "min-w-0 truncate text-sm",
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
        </span>

        <span
          className={cn(
            "mt-0.5 block truncate text-sm",
            unread ? "text-ink font-medium" : "text-ink-2",
          )}
        >
          {subject}
        </span>

        {(isDraft || email.snippet) && (
          <span className="text-ink-3 mt-0.5 block truncate text-xs leading-relaxed">
            {isDraft && <span className="text-danger font-medium">Draft</span>}
            {isDraft && email.snippet && " – "}
            {email.snippet}
          </span>
        )}
      </span>

      {/* Rightmost column - absolute date + time, Gmail-style */}
      <span className="text-ink-3 mt-0.5 shrink-0 whitespace-nowrap text-xs tabular-nums">
        {emailTimestamp(email.internalDate)}
      </span>
    </button>
  );
}
