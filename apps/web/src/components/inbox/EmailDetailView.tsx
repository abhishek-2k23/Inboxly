"use client";

import { useUser } from "@clerk/nextjs";
import {
  Archive,
  ArrowLeft,
  ChevronDown,
  FileImage,
  FileText,
  Paperclip,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { EmailSummary } from "@repo/shared";
import { archiveEmail, getEmail } from "@/lib/api";
import { formatBytes } from "@/lib/attachments";
import { useEmailStore } from "@/stores/email-store";
import { useToast } from "@/components/toast";
import {
  avatarColor,
  cn,
  emailPriority,
  emailTimestamp,
  initials,
  PRIORITY_COLOR,
  senderEmail,
  senderName,
} from "@/lib/ui";
import { FormattedText } from "@/components/shared/FormattedText";
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
    <div className="mx-auto max-w-5xl px-6 py-6">
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

function BodySkeleton() {
  return (
    <div className="space-y-2.5">
      <div className="bg-surface-hover h-3.5 w-full animate-pulse rounded" />
      <div className="bg-surface-hover h-3.5 w-11/12 animate-pulse rounded" />
      <div className="bg-surface-hover h-3.5 w-4/5 animate-pulse rounded" />
    </div>
  );
}

function fullDate(internalDate?: string | null): string {
  if (!internalDate) return "—";
  const ms = Number(internalDate);
  const d = isNaN(ms) ? new Date(internalDate) : new Date(ms);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Expandable sender meta row — shows "to me ▾" collapsed, full From/To/Date expanded. */
function SenderMeta({ email, myEmail }: { email: EmailSummary; myEmail: string }) {
  const [open, setOpen] = useState(false);
  const name = senderName(email.from);
  const fromAddr = senderEmail(email.from);
  const priority = emailPriority(email);

  return (
    <div className="mt-5 flex items-start gap-3">
      <span
        aria-hidden
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
        style={{ backgroundColor: avatarColor(name) }}
      >
        {initials(name)}
      </span>

      <div className="min-w-0 flex-1">
        {/* Name + priority dot */}
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

        {/* "to me ▾" toggle */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-ink-3 hover:text-ink-2 mt-0.5 inline-flex items-center gap-0.5 text-xs transition-colors"
        >
          to me
          <ChevronDown
            className={cn("h-3 w-3 transition-transform duration-200", open && "rotate-180")}
          />
        </button>

        {/* Expanded meta panel */}
        {open && (
          <div className="border-line bg-surface/50 mt-2 rounded-lg border px-3 py-2.5 text-xs">
            <MetaRow label="from" value={email.from ?? fromAddr} />
            <MetaRow label="to" value={email.to ?? myEmail ?? "me"} />
            {email.cc && <MetaRow label="cc" value={email.cc} />}
            <MetaRow label="date" value={fullDate(email.internalDate)} />
          </div>
        )}
      </div>

      <span className="text-ink-3 shrink-0 text-xs">{emailTimestamp(email.internalDate)}</span>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-0.5">
      <span className="text-ink-3 w-7 shrink-0">{label}:</span>
      <span className="text-ink-2 min-w-0 break-all">{value}</span>
    </div>
  );
}

const BACK_PATHS: Record<string, string> = {
  sent: "/dashboard/sent",
  archive: "/dashboard/archive",
};

/** Gmail-style full-page email reader: back nav, sender header, sanitized body, reply actions. */
export function EmailDetailView({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "inbox";
  const backHref = BACK_PATHS[from] ?? "/dashboard/inbox";
  const toast = useToast();
  const { user } = useUser();
  const myEmail = user?.primaryEmailAddress?.emailAddress ?? "";

  const cachedEmails = useEmailStore((s) => s.emails);
  const removeFromInbox = useEmailStore((s) => s.removeFromInbox);
  const addToArchived = useEmailStore((s) => s.addToArchived);
  const [email, setEmail] = useState<EmailSummary | null>(null);
  const [bodyLoading, setBodyLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const [composeOpen, setComposeOpen] = useState(false);
  const [draft, setDraft] = useState<ComposeDraft | undefined>(undefined);

  useEffect(() => {
    let active = true;
    const cached = cachedEmails.find((e) => e.id === id) ?? null;
    setEmail(cached);
    setNotFound(false);
    setBodyLoading(true);
    getEmail(id)
      .then(({ email }) => {
        if (active) setEmail(email);
      })
      .catch(() => {
        if (active && !cached) setNotFound(true);
      })
      .finally(() => {
        if (active) setBodyLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleArchive() {
    if (!email || archiving) return;
    setArchiving(true);
    try {
      const { email: archived } = await archiveEmail(email.id);
      removeFromInbox(email.id);
      addToArchived(archived);
      toast.success("Email archived.");
      router.push(backHref);
    } catch {
      toast.error("Couldn't archive this email.");
    } finally {
      setArchiving(false);
    }
  }

  function openReply(withAi: boolean) {
    if (!email) return;
    const fromAddr = senderEmail(email.from);
    // If the sender is the logged-in user (e.g. sent-to-self), reply to the
    // original recipient instead so the To field is never the user's own address.
    const replyTo = fromAddr && fromAddr !== myEmail ? fromAddr : senderEmail(email.to);
    const re = email.subject?.trim();
    setDraft({
      to: replyTo,
      subject: re ? (re.toLowerCase().startsWith("re:") ? re : `Re: ${re}`) : undefined,
    });
    setComposeOpen(true);
    if (withAi) toast.info("Drafting with Inboxly AI is coming soon.");
  }

  const subject = email?.subject?.trim() || "(no subject)";
  const showReplyBar = !notFound && !!email;

  return (
    <div className="flex h-full min-w-0">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="border-line flex h-16 shrink-0 items-center gap-1 border-b px-4">
          <Link
            href={backHref}
            aria-label="Back"
            title="Back"
            className="text-ink-2 hover:bg-surface hover:text-ink grid h-9 w-9 place-items-center rounded-lg transition-colors"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Link>
          <span className="bg-line mx-1 h-5 w-px" />
          <ToolbarButton icon={Archive} label="Archive" onClick={handleArchive} />
          <ToolbarButton
            icon={Trash2}
            label="Delete"
            onClick={() => toast.info("Deleting is coming soon.")}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {!email && !notFound ? (
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
            <div className="mx-auto max-w-5xl px-6 py-6">
              <h1 className="text-ink text-xl font-semibold tracking-tight">{subject}</h1>

              <SenderMeta email={email} myEmail={myEmail} />

              <div className="mt-6">
                {bodyLoading ? (
                  <BodySkeleton />
                ) : email.bodyHtml ? (
                  <EmailHtmlBody html={email.bodyHtml} />
                ) : email.body?.trim() || email.snippet?.trim() ? (
                  <FormattedText text={email.body?.trim() || email.snippet?.trim() || ""} />
                ) : (
                  <p className="text-ink-2 text-sm leading-relaxed">No preview available.</p>
                )}
              </div>

              {email.attachments && email.attachments.length > 0 && (
                <div className="border-line mt-6 border-t pt-4">
                  <p className="text-ink-3 mb-2.5 flex items-center gap-1.5 text-xs font-medium">
                    <Paperclip className="h-3.5 w-3.5" />
                    {email.attachments.length} attachment
                    {email.attachments.length === 1 ? "" : "s"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {email.attachments.map((att, i) => {
                      const Icon = att.mimeType.startsWith("image/") ? FileImage : FileText;
                      return (
                        <span
                          key={`${att.filename}-${i}`}
                          className="border-line bg-surface/60 text-ink flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs"
                        >
                          <span className="bg-surface text-ink-2 grid h-8 w-8 shrink-0 place-items-center rounded-md">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block max-w-[14rem] truncate font-medium">
                              {att.filename}
                            </span>
                            {att.size > 0 && (
                              <span className="text-ink-3 block">{formatBytes(att.size)}</span>
                            )}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reply bar */}
        {showReplyBar && (
          <div className="border-line bg-panel shrink-0 border-t px-6 py-4">
            <div className="mx-auto flex max-w-5xl items-center gap-2">
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

      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} draft={draft} />
    </div>
  );
}
