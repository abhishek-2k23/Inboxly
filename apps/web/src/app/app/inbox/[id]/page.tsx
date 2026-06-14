"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, EmailSummary } from "@repo/shared";
import { listEmails, sendChatMessage } from "@/lib/api";
import { Avatar, IconButton, ThinkingDots } from "@/components/ui";
import { relativeTime, senderEmail, senderName } from "@/lib/ui";

export default function EmailDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = decodeURIComponent(params.id);

  const [email, setEmail] = useState<EmailSummary | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [reply, setReply] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    try {
      // No single-email endpoint exists; resolve from the cached inbox list.
      const { emails } = await listEmails({ limit: 100 });
      setEmail(emails.find((e) => e.id === id) ?? null);
    } finally {
      setLoaded(true);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const openReply = useCallback(() => {
    setShowReply(true);
    setStatus(null);
    setTimeout(() => replyRef.current?.focus(), 0);
  }, []);

  // R opens reply, E archives (back to inbox).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "r") {
        e.preventDefault();
        openReply();
      } else if (e.key === "e") {
        router.push("/app/inbox");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openReply, router]);

  async function sendReply() {
    const text = reply.trim();
    if (!text || !email || isSending) return;
    setIsSending(true);
    setStatus(null);

    const to = senderEmail(email.from);
    const subject = email.subject ? `Re: ${email.subject}` : "Re:";
    const instruction = `Reply to the email from ${email.from} (subject "${email.subject ?? ""}"). Send it to ${to} with subject "${subject}". The reply should say: ${text}`;
    const messages: ChatMessage[] = [{ role: "user", content: instruction }];

    try {
      const res = await sendChatMessage(messages);
      setStatus(res.message.content || "Reply sent.");
      setReply("");
      setShowReply(false);
    } catch {
      setStatus("Couldn't send the reply. Is the API running and Gmail connected?");
    } finally {
      setIsSending(false);
    }
  }

  const name = senderName(email?.from);

  return (
    <div className="flex h-full flex-col">
      {/* action bar */}
      <header className="hairline-b flex shrink-0 items-center gap-1 px-4 py-3">
        <Link href="/app/inbox">
          <IconButton icon="ti-arrow-left" label="Back to inbox" />
        </Link>
        <div className="bg-line mx-2 h-5 w-px" />
        <IconButton icon="ti-reply" label="Reply" shortcut="R" onClick={openReply} accent />
        <IconButton icon="ti-reply-all" label="Reply all" onClick={openReply} />
        <IconButton icon="ti-mail-forward" label="Forward" onClick={openReply} />
        <div className="bg-line mx-2 h-5 w-px" />
        <IconButton
          icon="ti-archive"
          label="Archive"
          shortcut="E"
          onClick={() => router.push("/app/inbox")}
        />
        <IconButton icon="ti-trash" label="Delete" onClick={() => router.push("/app/inbox")} />
        <IconButton icon="ti-clock" label="Snooze" />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {!loaded && <DetailSkeleton />}

        {loaded && !email && (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <i className="ti ti-mail-off text-ink-3 text-3xl" aria-hidden />
            <p className="text-ink-2 text-sm">This email isn’t in the cached inbox.</p>
            <Link href="/app/inbox" className="text-accent-light text-xs hover:underline">
              Back to inbox
            </Link>
          </div>
        )}

        {loaded && email && (
          <article className="mx-auto flex max-w-3xl flex-col gap-5">
            <h1 className="text-ink text-xl font-medium">{email.subject || "(no subject)"}</h1>

            <div className="flex items-center gap-3">
              <Avatar name={name} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-ink text-sm font-medium">{name}</span>
                  <span className="text-ink-3 truncate text-xs">
                    &lt;{senderEmail(email.from)}&gt;
                  </span>
                </div>
                {email.to && <span className="text-ink-3 text-xs">to {email.to}</span>}
              </div>
              <span className="text-ink-3 shrink-0 text-xs">
                {relativeTime(email.internalDate)}
              </span>
            </div>

            <div className="bg-line h-px w-full" />

            <div className="text-ink-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
              {email.body || email.snippet || "(no content)"}
            </div>

            {status && (
              <p className="bg-accent-fill text-accent-light flex items-center gap-2 rounded-[var(--radius-ctl)] px-3 py-2 text-xs">
                <i className="ti ti-check" aria-hidden />
                {status}
              </p>
            )}

            {/* reply box (also triggerable via the prompt — "reply saying…") */}
            {showReply ? (
              <div className="bg-panel hairline flex flex-col gap-2 rounded-[var(--radius-card)] p-4">
                <div className="text-ink-2 flex items-center gap-2 text-xs">
                  <i className="ti ti-reply text-accent-light" aria-hidden />
                  Replying to {name}
                  <button
                    type="button"
                    className="text-ink-3 hover:text-ink ml-auto"
                    onClick={() => setShowReply(false)}
                    aria-label="Discard reply"
                  >
                    <i className="ti ti-x" aria-hidden />
                  </button>
                </div>
                <textarea
                  ref={replyRef}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={5}
                  placeholder="Write your reply, or describe it — the AI will compose and send it…"
                  className="bg-page text-ink hairline placeholder:text-ink-3 focus:border-accent w-full resize-none rounded-[var(--radius-ctl)] px-3 py-2 text-sm outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void sendReply()}
                    disabled={isSending || !reply.trim()}
                    className="bg-accent text-accent-ink hover:bg-accent-light flex items-center gap-2 rounded-[var(--radius-ctl)] px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <i className="ti ti-send" aria-hidden />
                    Send
                  </button>
                  {isSending && <ThinkingDots label="Sending via AI" />}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={openReply}
                className="text-ink-2 hairline hover:text-ink flex items-center gap-2 self-start rounded-[var(--radius-ctl)] px-4 py-2 text-sm transition-colors"
              >
                <i className="ti ti-reply" aria-hidden />
                Reply
              </button>
            )}
          </article>
        )}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="skeleton h-6 w-2/3 rounded" />
      <div className="flex items-center gap-3">
        <div className="skeleton h-10 w-10 rounded-full" />
        <div className="skeleton h-4 w-40 rounded" />
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-3 w-full rounded" />
        ))}
      </div>
    </div>
  );
}
