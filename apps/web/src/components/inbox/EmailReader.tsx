"use client";

import { Sparkles, X } from "lucide-react";
import { useEffect } from "react";
import type { EmailSummary } from "@repo/shared";
import {
  avatarColor,
  emailPriority,
  initials,
  PRIORITY_COLOR,
  senderEmail,
  senderName,
} from "@/lib/ui";

function fullDate(internalDate?: string | null): string {
  if (!internalDate) return "";
  const ts = Number(internalDate);
  if (!Number.isFinite(ts)) return "";
  return new Date(ts).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Centered reading view for a single email, with a "Reply with AI" action. */
export function EmailReader({
  email,
  onClose,
  onReply,
}: {
  email: EmailSummary;
  onClose: () => void;
  onReply: (email: EmailSummary) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const name = senderName(email.from);
  const address = senderEmail(email.from);
  const subject = email.subject?.trim() || "(no subject)";
  const priority = emailPriority(email);
  const body = email.body?.trim() || email.snippet?.trim() || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close email"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />

      {/* Panel */}
      <div className="border-line bg-panel relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border">
        {/* Header */}
        <div className="border-line flex items-start gap-3 border-b px-6 py-5">
          <span
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: avatarColor(name) }}
          >
            {initials(name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-ink truncate text-sm font-semibold">{name}</p>
              {priority !== "none" && (
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: PRIORITY_COLOR[priority] }}
                />
              )}
            </div>
            {address && <p className="text-ink-3 truncate text-xs">{address}</p>}
          </div>
          <span className="text-ink-3 shrink-0 text-xs">{fullDate(email.internalDate)}</span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-ink-3 hover:bg-surface hover:text-ink -mr-2 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Subject + body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <h1 className="text-ink text-lg font-semibold tracking-tight">{subject}</h1>
          {body ? (
            <p className="text-ink-2 mt-4 whitespace-pre-wrap text-sm leading-relaxed">{body}</p>
          ) : (
            <p className="text-ink-3 mt-4 text-sm italic">No preview available for this message.</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-line flex items-center justify-end gap-2 border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="text-ink-2 hover:bg-surface hover:text-ink h-10 rounded-lg px-4 text-sm font-medium transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onReply(email)}
            className="bg-accent text-accent-ink hover:bg-accent-light inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Reply with AI
          </button>
        </div>
      </div>
    </div>
  );
}
