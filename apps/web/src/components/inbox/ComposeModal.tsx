"use client";

import {
  Link2,
  Maximize2,
  Minus,
  Paperclip,
  Send,
  Smile,
  Sparkles,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { deleteDraft, sendEmail } from "@/lib/api";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/ui";
import { useEmailStore } from "@/stores/email-store";

export interface ComposeDraft {
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  /** Set when editing a saved Gmail draft - sending removes it from the Drafts tab and Gmail's Drafts folder. */
  draftId?: string;
}

function splitRecipients(value?: string): string[] {
  return value
    ? value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : [];
}

function RecipientField({
  label,
  recipients,
  input,
  onInputChange,
  onCommit,
  onRemove,
  trailing,
  autoFocus,
}: {
  label: string;
  recipients: string[];
  input: string;
  onInputChange: (value: string) => void;
  onCommit: () => void;
  onRemove: (index: number) => void;
  trailing?: React.ReactNode;
  autoFocus?: boolean;
}) {
  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      if (input.trim()) {
        e.preventDefault();
        onCommit();
      }
    } else if (e.key === "Backspace" && !input && recipients.length > 0) {
      onRemove(recipients.length - 1);
    }
  }

  return (
    <div className="border-line flex items-center gap-2 border-b px-4 py-2.5">
      <span className="text-ink-3 w-10 shrink-0 text-sm">{label}</span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {recipients.map((r, i) => (
          <span
            key={`${r}-${i}`}
            className="bg-surface border-line text-ink flex items-center gap-1 rounded-full border py-0.5 pl-2.5 pr-1 text-xs"
          >
            <span className="max-w-[12rem] truncate">{r}</span>
            <button
              type="button"
              aria-label={`Remove ${r}`}
              onClick={() => onRemove(i)}
              className="text-ink-3 hover:text-ink grid h-4 w-4 place-items-center rounded-full transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          autoFocus={autoFocus}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => input.trim() && onCommit()}
          className="text-ink placeholder:text-ink-3 min-w-[6rem] flex-1 bg-transparent py-0.5 text-sm outline-none"
        />
      </div>
      {trailing}
    </div>
  );
}

/** Gmail-inspired compose window, anchored bottom-right. */
export function ComposeModal({
  open,
  onClose,
  draft,
}: {
  open: boolean;
  onClose: () => void;
  draft?: ComposeDraft;
}) {
  const toast = useToast();
  const loadSent = useEmailStore((s) => s.loadSent);
  const removeDraft = useEmailStore((s) => s.removeDraft);
  const [minimized, setMinimized] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [sending, setSending] = useState(false);

  const [to, setTo] = useState<string[]>([]);
  const [toInput, setToInput] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [cc, setCc] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState("");
  const [showBcc, setShowBcc] = useState(false);
  const [bcc, setBcc] = useState<string[]>([]);
  const [bccInput, setBccInput] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Hydrate from a draft (e.g. "Reply with AI" prefills the recipient/subject)
  // whenever the window is (re)opened.
  useEffect(() => {
    if (!open) return;
    setMinimized(false);
    setTo(splitRecipients(draft?.to));
    setToInput("");
    setCc(splitRecipients(draft?.cc));
    setBcc(splitRecipients(draft?.bcc));
    setShowCc(Boolean(draft?.cc));
    setShowBcc(Boolean(draft?.bcc));
    setSubject(draft?.subject ?? "");
    setBody(draft?.body ?? "");
  }, [open, draft]);

  function draftWithAI() {
    toast.info("Drafting with Inboxly AI is coming soon.");
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent | globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        draftWithAI();
      }
    }
    document.addEventListener("keydown", onKey as EventListener);
    return () => document.removeEventListener("keydown", onKey as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function commit(
    value: string,
    setList: (fn: (prev: string[]) => string[]) => void,
    clear: () => void,
  ) {
    const trimmed = value.trim().replace(/[,;]+$/, "");
    if (trimmed) setList((prev) => [...prev, trimmed]);
    clear();
  }

  async function handleSend() {
    if (sending) return;

    const recipients = toInput.trim() ? [...to, toInput.trim()] : to;
    if (recipients.length === 0) {
      toast.error("Add at least one recipient.");
      return;
    }
    if (!body.trim()) {
      toast.error("Write a message before sending.");
      return;
    }

    setSending(true);
    try {
      await sendEmail({
        to: recipients.join(", "),
        cc: cc.length ? cc.join(", ") : undefined,
        bcc: bcc.length ? bcc.join(", ") : undefined,
        subject: subject.trim() || undefined,
        body,
      });
      if (draft?.draftId) {
        removeDraft(draft.draftId);
        // The draft was sent via a fresh message above (so edits made in this
        // window are respected); the original is now stale and just clutters
        // Gmail's Drafts folder if left behind.
        void deleteDraft(draft.draftId).catch(() => {});
      }
      toast.success("Message sent.");
      void loadSent();
      onClose();
    } catch {
      toast.error("Couldn't send your message. Try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleDiscard() {
    if (draft?.draftId) {
      removeDraft(draft.draftId);
      try {
        await deleteDraft(draft.draftId);
      } catch {
        // Best-effort: it's already gone from the visible Drafts tab.
      }
    }
    onClose();
  }

  const TOOLBAR_ICONS = [
    { icon: Type, label: "Formatting" },
    { icon: Paperclip, label: "Attach file" },
    { icon: Link2, label: "Insert link" },
    { icon: Smile, label: "Insert emoji" },
  ];

  // Minimized: collapse to just the title bar.
  const containerClass = fullscreen
    ? "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    : "fixed bottom-0 right-6 z-50";

  return (
    <div className={containerClass}>
      {fullscreen && (
        <button
          type="button"
          aria-label="Close compose"
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        />
      )}

      <div
        className={cn(
          "border-line bg-panel relative flex flex-col overflow-hidden border",
          fullscreen
            ? "max-h-[85vh] w-full max-w-2xl rounded-2xl"
            : "w-[min(34rem,calc(100vw-1rem))] rounded-t-xl",
          !fullscreen && (minimized ? "h-auto" : "h-[32rem]"),
        )}
      >
        {/* Title bar */}
        <div className="bg-bg-secondary border-line flex h-11 shrink-0 items-center justify-between border-b pl-4 pr-2">
          <span className="text-ink text-sm font-medium">
            {draft?.draftId ? "Edit draft" : "New Message"}
          </span>
          <div className="flex items-center">
            {!fullscreen && (
              <button
                type="button"
                aria-label={minimized ? "Expand" : "Minimize"}
                onClick={() => setMinimized((m) => !m)}
                className="text-ink-3 hover:bg-surface hover:text-ink grid h-8 w-8 place-items-center rounded-md transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
              onClick={() => {
                setFullscreen((f) => !f);
                setMinimized(false);
              }}
              className="text-ink-3 hover:bg-surface hover:text-ink grid h-8 w-8 place-items-center rounded-md transition-colors"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="text-ink-3 hover:bg-surface hover:text-ink grid h-8 w-8 place-items-center rounded-md transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!minimized && (
          <>
            {/* Recipients */}
            <RecipientField
              label="To"
              recipients={to}
              input={toInput}
              onInputChange={setToInput}
              onCommit={() => commit(toInput, setTo, () => setToInput(""))}
              onRemove={(i) => setTo((prev) => prev.filter((_, idx) => idx !== i))}
              autoFocus={!draft?.to}
              trailing={
                <div className="text-ink-3 flex shrink-0 items-center gap-2 text-xs">
                  {!showCc && (
                    <button
                      type="button"
                      onClick={() => setShowCc(true)}
                      className="hover:text-ink transition-colors"
                    >
                      Cc
                    </button>
                  )}
                  {!showBcc && (
                    <button
                      type="button"
                      onClick={() => setShowBcc(true)}
                      className="hover:text-ink transition-colors"
                    >
                      Bcc
                    </button>
                  )}
                </div>
              }
            />

            {showCc && (
              <RecipientField
                label="Cc"
                recipients={cc}
                input={ccInput}
                onInputChange={setCcInput}
                onCommit={() => commit(ccInput, setCc, () => setCcInput(""))}
                onRemove={(i) => setCc((prev) => prev.filter((_, idx) => idx !== i))}
              />
            )}

            {showBcc && (
              <RecipientField
                label="Bcc"
                recipients={bcc}
                input={bccInput}
                onInputChange={setBccInput}
                onCommit={() => commit(bccInput, setBcc, () => setBccInput(""))}
                onRemove={(i) => setBcc((prev) => prev.filter((_, idx) => idx !== i))}
              />
            )}

            {/* Subject */}
            <div className="border-line border-b px-4 py-2.5">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="text-ink placeholder:text-ink-3 w-full bg-transparent text-sm outline-none"
              />
            </div>

            {/* Body */}
            <div className="relative flex min-h-0 flex-1 flex-col">
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message…"
                className="text-ink placeholder:text-ink-3 min-h-0 flex-1 resize-none bg-transparent px-4 py-3 text-sm leading-relaxed outline-none"
              />
              <button
                type="button"
                onClick={draftWithAI}
                className="border-line text-ink-2 hover:border-line-strong hover:text-ink mx-4 mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors"
              >
                <Sparkles className="text-accent h-3.5 w-3.5" />
                Press <kbd className="font-sans font-medium">⌘J</kbd> to draft with Inboxly AI
              </button>
            </div>

            {/* Toolbar */}
            <div className="border-line flex shrink-0 items-center justify-between border-t px-3 py-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending}
                  className="bg-accent text-accent-ink hover:bg-accent-light inline-flex h-9 items-center gap-2 rounded-lg pl-4 pr-3.5 text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {sending ? "Sending…" : "Send"}
                  <Send className="h-3.5 w-3.5" />
                </button>
                <span className="bg-line mx-1.5 h-5 w-px" />
                {TOOLBAR_ICONS.map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    aria-label={label}
                    title={label}
                    className="text-ink-3 hover:bg-surface hover:text-ink grid h-8 w-8 place-items-center rounded-md transition-colors"
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                aria-label="Discard draft"
                title="Discard draft"
                onClick={handleDiscard}
                className="text-ink-3 hover:bg-surface hover:text-danger grid h-8 w-8 place-items-center rounded-md transition-colors"
              >
                <Trash2 className="h-[18px] w-[18px]" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
