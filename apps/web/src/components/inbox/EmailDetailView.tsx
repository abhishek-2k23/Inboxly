"use client";

import { Archive, ArrowLeft, Sparkles, Trash2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { EmailSummary } from "@repo/shared";
import { getEmail } from "@/lib/api";
import { useToast } from "@/components/toast";
import {
  avatarColor,
  emailPriority,
  emailTimestamp,
  initials,
  PRIORITY_COLOR,
  senderEmail,
  senderName,
} from "@/lib/ui";
import { CalendarSidebar } from "./CalendarSidebar";
import { ComposeModal } from "./ComposeModal";
import { EmailHtmlBody } from "./EmailHtmlBody";

interface ComposeDraft {
  to?: string;
  subject?: string;
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="text-ink-2 hover:bg-surface hover:text-ink grid h-9 w-9 place-items-center rounded-lg transition-colors"
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}

function DetailSkeleton() {
  return (
    <div className="px-6 py-6">
      <div className="bg-surface-hover h-6 w-2/3 animate-pulse rounded" />
      <div className="mt-6 flex items-center gap-3">
        <div className="bg-surface-hover h-10 w-10 animate-pulse rounded-full" />
        <div className="space-y-2">
          <div className="bg-surface-hover h-3 w-32 animate-pulse rounded" />
          <div className="bg-surface-hover h-3 w-48 animate-pulse rounded" />
        </div>
      </div>
      <div className="bg-surface-hover mt-8 h-64 animate-pulse rounded-xl" />
    </div>
  );
}

/** Gmail-style full-page email reader: back nav, sender header, sanitized body, reply actions. */
export function EmailDetailView({ id }: { id: string }) {
  const toast = useToast();
  const [email, setEmail] = useState<EmailSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [composeOpen, setComposeOpen] = useState(false);
  const [draft, setDraft] = useState<ComposeDraft | undefined>(undefined);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    getEmail(id)
      .then(({ email }) => {
        if (active) setEmail(email);
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  function openReply(withAi: boolean) {
    if (!email) return;
    const re = email.subject?.trim();
    setDraft({
      to: senderEmail(email.from),
      subject: re ? (re.toLowerCase().startsWith("re:") ? re : `Re: ${re}`) : undefined,
    });
    setComposeOpen(true);
    if (withAi) toast.info("Drafting with Inboxly AI is coming soon.");
  }

  const name = email ? senderName(email.from) : "";
  const address = email ? senderEmail(email.from) : "";
  const subject = email?.subject?.trim() || "(no subject)";
  const priority = email ? emailPriority(email) : "none";

  return (
    <div className="flex h-full min-w-0">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Toolbar */}
        <div className="border-line flex h-16 shrink-0 items-center gap-1 border-b px-4">
          <Link
            href="/dashboard/inbox"
            aria-label="Back to inbox"
            title="Back to inbox"
            className="text-ink-2 hover:bg-surface hover:text-ink grid h-9 w-9 place-items-center rounded-lg transition-colors"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Link>
          <span className="bg-line mx-1 h-5 w-px" />
          <ToolbarButton
            icon={Archive}
            label="Archive"
            onClick={() => toast.info("Archiving is coming soon.")}
          />
          <ToolbarButton
            icon={Trash2}
            label="Delete"
            onClick={() => toast.info("Deleting is coming soon.")}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <DetailSkeleton />
          ) : notFound || !email ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <h1 className="text-ink text-lg font-semibold">Email not found</h1>
              <p className="text-ink-3 mt-1.5 text-sm">It may have been removed or never synced.</p>
              <Link
                href="/dashboard/inbox"
                className="text-accent hover:text-accent-light mt-4 text-sm font-medium"
              >
                Back to inbox
              </Link>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl px-6 py-6">
              <h1 className="text-ink text-xl font-semibold tracking-tight">{subject}</h1>

              <div className="mt-5 flex items-start gap-3">
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
                <span className="text-ink-3 shrink-0 text-xs">
                  {emailTimestamp(email.internalDate)}
                </span>
              </div>

              <div className="mt-6">
                {email.bodyHtml ? (
                  <EmailHtmlBody html={email.bodyHtml} />
                ) : (
                  <p className="text-ink-2 whitespace-pre-wrap text-sm leading-relaxed">
                    {email.body?.trim() || email.snippet?.trim() || "No preview available."}
                  </p>
                )}
              </div>

              <div className="mt-8 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openReply(false)}
                  className="border-line text-ink hover:bg-surface-hover h-10 rounded-lg border px-4 text-sm font-medium transition-colors"
                >
                  Reply
                </button>
                <button
                  type="button"
                  onClick={() => openReply(true)}
                  className="bg-accent text-accent-ink hover:bg-accent-light inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  Reply with AI
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CalendarSidebar />

      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} draft={draft} />
    </div>
  );
}
