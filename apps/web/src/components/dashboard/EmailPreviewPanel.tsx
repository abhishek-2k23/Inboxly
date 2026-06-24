"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { EmailSummary } from "@repo/shared";
import { getEmail } from "@/lib/api";
import { EmailHtmlBody } from "@/components/inbox/EmailHtmlBody";
import { FormattedText } from "@/components/shared/FormattedText";
import { avatarColor, emailTimestamp, initials, senderEmail, senderName } from "@/lib/ui";

function fullDate(internalDate?: string | null): string {
  if (!internalDate) return "";
  const ms = Number(internalDate);
  const d = isNaN(ms) ? new Date(internalDate) : new Date(ms);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="bg-surface h-5 w-3/4 animate-pulse rounded" />
      <div className="flex items-center gap-3">
        <div className="bg-surface h-9 w-9 animate-pulse rounded-full" />
        <div className="flex flex-col gap-1.5">
          <div className="bg-surface h-3 w-28 animate-pulse rounded" />
          <div className="bg-surface h-3 w-40 animate-pulse rounded" />
        </div>
      </div>
      <div className="bg-surface h-40 animate-pulse rounded-xl" />
    </div>
  );
}

function SenderRow({ email }: { email: EmailSummary }) {
  const [open, setOpen] = useState(false);
  const name = senderName(email.from);
  const fromAddr = senderEmail(email.from);

  return (
    <div className="flex items-start gap-3">
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
        style={{ backgroundColor: avatarColor(name) }}
      >
        {initials(name)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-ink truncate text-sm font-semibold">{name}</p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-ink-3 hover:text-ink-2 mt-0.5 inline-flex items-center gap-0.5 text-xs transition-colors"
        >
          {fromAddr || "unknown sender"}
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="border-line bg-surface/50 mt-2 space-y-0.5 rounded-lg border px-3 py-2 text-xs">
            {email.from && (
              <div className="flex gap-2">
                <span className="text-ink-3 w-6 shrink-0">from</span>
                <span className="text-ink-2 min-w-0 break-all">{email.from}</span>
              </div>
            )}
            {email.to && (
              <div className="flex gap-2">
                <span className="text-ink-3 w-6 shrink-0">to</span>
                <span className="text-ink-2 min-w-0 break-all">{email.to}</span>
              </div>
            )}
            {email.cc && (
              <div className="flex gap-2">
                <span className="text-ink-3 w-6 shrink-0">cc</span>
                <span className="text-ink-2 min-w-0 break-all">{email.cc}</span>
              </div>
            )}
            {email.internalDate && (
              <div className="flex gap-2">
                <span className="text-ink-3 w-6 shrink-0">on</span>
                <span className="text-ink-2">{fullDate(email.internalDate)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <span className="text-ink-3 shrink-0 text-xs">{emailTimestamp(email.internalDate)}</span>
    </div>
  );
}

export function EmailPreviewPanel({ emailId, onClose }: { emailId: string; onClose: () => void }) {
  const [email, setEmail] = useState<EmailSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setEmail(null);
    setLoading(true);
    setError(false);

    getEmail(emailId)
      .then(({ email: fetched }) => {
        if (active) setEmail(fetched);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [emailId]);

  const subject = email?.subject?.trim() || "(no subject)";

  return (
    <div className="border-line bg-panel flex h-full w-[420px] shrink-0 flex-col border-l">
      {/* Header */}
      <div className="border-line flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <p className="text-ink min-w-0 flex-1 truncate text-sm font-semibold">
          {loading ? "Loading…" : error ? "Email not found" : subject}
        </p>
        <button
          type="button"
          aria-label="Close preview"
          onClick={onClose}
          className="text-ink-3 hover:bg-surface hover:text-ink grid h-7 w-7 shrink-0 place-items-center rounded-md transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <PanelSkeleton />
        ) : error || !email ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <p className="text-ink text-sm font-medium">Email not found</p>
            <p className="text-ink-3 mt-1 text-xs">It may have been removed or never synced.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 p-5">
            {/* Subject */}
            <h2 className="text-ink text-base font-semibold leading-snug">{subject}</h2>

            {/* Sender row */}
            <SenderRow email={email} />

            {/* Divider */}
            <hr className="border-line" />

            {/* Body */}
            <div>
              {email.bodyHtml ? (
                <EmailHtmlBody html={email.bodyHtml} />
              ) : email.body?.trim() || email.snippet?.trim() ? (
                <FormattedText text={email.body?.trim() || email.snippet?.trim() || ""} />
              ) : (
                <p className="text-ink-3 text-sm">No preview available.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
