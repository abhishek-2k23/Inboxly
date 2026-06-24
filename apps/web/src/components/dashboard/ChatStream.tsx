"use client";

import DOMPurify from "dompurify";
import { CalendarCheck, Check, Copy, Mail, Pencil, Sparkles } from "lucide-react";
import { marked } from "marked";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTypewriter } from "@/hooks/use-typewriter";
import type { ChatStoreMessage } from "@/stores/chat-store";

marked.setOptions({ breaks: true, gfm: true });

// Detects emoji-prefixed blockquotes produced by marked and adds a colour
// class so the CSS can style them as success / error / warning / info callouts.
// Must run before DOMPurify (which preserves class attributes on safe elements).
const CALLOUT_MAP: [RegExp, string][] = [
  [/<blockquote>\s*<p>Done:/gi, '<blockquote class="callout-success"><p>Done:'],
  [/<blockquote>\s*<p>Error:/gi, '<blockquote class="callout-error"><p>Error:'],
  [/<blockquote>\s*<p>Warning:/gi, '<blockquote class="callout-warning"><p>Warning:'],
  [/<blockquote>\s*<p>Note:/gi, '<blockquote class="callout-info"><p>Note:'],
  [/<blockquote>\s*<p>Tip:/gi, '<blockquote class="callout-info"><p>Tip:'],
];

function applyCallouts(html: string): string {
  let out = html;
  for (const [re, replacement] of CALLOUT_MAP) {
    out = out.replace(re, replacement);
  }
  return out;
}

export function ChatStream({
  messages,
  sending,
  streamingId,
  onStreamDone,
  onEmailClick,
  onEditMessage,
}: {
  messages: ChatStoreMessage[];
  sending: boolean;
  streamingId: string | null;
  onStreamDone: () => void;
  onEmailClick?: (emailId: string) => void;
  /** Called with a user message's content when the pencil icon is clicked. */
  onEditMessage?: (content: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep pinned to the latest content, including while text streams in.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  useEffect(() => {
    if (!streamingId) return;
    const interval = setInterval(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      120,
    );
    return () => clearInterval(interval);
  }, [streamingId]);

  const awaitingReply = sending && messages[messages.length - 1]?.role === "user";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {messages.map((message) => (
        <MessageRow
          key={message.id}
          message={message}
          streaming={message.id === streamingId}
          onStreamDone={onStreamDone}
          onEmailClick={onEmailClick}
          onEditMessage={onEditMessage}
        />
      ))}

      {awaitingReply && (
        <div className="flex items-start gap-3">
          <AgentAvatar />
          <ThinkingIndicator />
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function MessageRow({
  message,
  streaming,
  onStreamDone,
  onEmailClick,
  onEditMessage,
}: {
  message: ChatStoreMessage;
  streaming: boolean;
  onStreamDone: () => void;
  onEmailClick?: (emailId: string) => void;
  onEditMessage?: (content: string) => void;
}) {
  const { shown, done } = useTypewriter(message.content, streaming, onStreamDone);

  if (message.role === "user") {
    return (
      <div className="animate-rise-in group flex flex-col items-end gap-1">
        <div className="bg-accent text-accent-ink max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tr-md px-4 py-2.5 text-sm leading-relaxed">
          {message.content}
        </div>
        {/* Action bar — bottom-right, fades in on hover */}
        <MessageActions
          content={message.content}
          align="end"
          onEdit={onEditMessage ? () => onEditMessage(message.content) : undefined}
        />
      </div>
    );
  }

  return (
    <div className="animate-rise-in group">
      <div
        className={
          message.isError ? "border-danger/30 bg-danger/5 rounded-xl border px-4 py-3" : ""
        }
      >
        <MarkdownMessage content={shown} streaming={streaming && !done} isError={message.isError} />
      </div>

      {message.events && message.events.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {message.events.map((event) => (
            <span
              key={event.id}
              className="border-line text-ink-2 inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-1.5 text-xs"
            >
              <CalendarCheck className="text-success h-3.5 w-3.5" />
              {event.summary ?? "Event created"}
            </span>
          ))}
        </div>
      )}

      {message.referencedEmails && message.referencedEmails.length > 0 && onEmailClick && (
        <div className="mt-2.5 flex flex-col gap-1">
          <p className="text-ink-3 mb-0.5 text-[11px] font-medium uppercase tracking-wide">
            Sources
          </p>
          {message.referencedEmails.map((email) => (
            <button
              key={email.id}
              type="button"
              onClick={() => onEmailClick(email.id)}
              className="border-line bg-surface/50 hover:bg-surface hover:border-line-strong text-ink-2 hover:text-ink inline-flex w-fit max-w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all duration-150"
            >
              <Mail className="text-accent h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 truncate font-medium">
                {email.subject?.trim() || "(no subject)"}
              </span>
              {email.from && (
                <span className="text-ink-3 shrink-0 truncate">
                  · {email.from.replace(/<[^>]+>/g, "").trim()}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Action bar — bottom-right of the AI message, copy only */}
      {!streaming && <MessageActions content={message.content} align="start" />}
    </div>
  );
}

function MessageActions({
  content,
  align,
  onEdit,
}: {
  content: string;
  align: "start" | "end";
  onEdit?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard access denied — silently ignore */
    }
  }, [content]);

  return (
    <div
      className={`mt-1 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 ${
        align === "end" ? "justify-end" : "justify-start"
      }`}
    >
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? "Copied!" : "Copy"}
        className="text-ink-3 hover:text-ink hover:bg-surface grid h-6 w-6 place-items-center rounded-md transition-colors"
      >
        {copied ? <Check className="text-success h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>

      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          title="Edit and resend"
          className="text-ink-3 hover:text-ink hover:bg-surface grid h-6 w-6 place-items-center rounded-md transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function MarkdownMessage({
  content,
  streaming,
  isError,
}: {
  content: string;
  streaming: boolean;
  isError?: boolean;
}) {
  const html = useMemo(() => {
    const raw = marked.parse(content, { async: false }) as string;
    const withCallouts = applyCallouts(raw);
    return DOMPurify.sanitize(withCallouts, { USE_PROFILES: { html: true } });
  }, [content]);

  return (
    <div className="relative">
      <div
        className={isError ? "agent-message text-danger" : "agent-message"}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {streaming && <span className="stream-caret align-middle" />}
    </div>
  );
}

function AgentAvatar() {
  return (
    <span className="bg-primary-soft text-accent grid h-8 w-8 shrink-0 place-items-center rounded-full">
      <Sparkles className="h-4 w-4" />
    </span>
  );
}

/** AI-flavored status words cycled under the loader while we await a reply. */
const THINKING_PHRASES = [
  "Thinking",
  "Brewing",
  "Pondering",
  "Reasoning",
  "Connecting the dots",
  "Cooking up a reply",
  "Composing",
  "Almost there",
] as const;

const PHRASE_INTERVAL_MS = 2200;

/** Bouncing dots plus a phrase that rotates every couple of seconds. */
function ThinkingIndicator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setIndex((i) => (i + 1) % THINKING_PHRASES.length),
      PHRASE_INTERVAL_MS,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-surface flex items-center gap-2 rounded-2xl rounded-tl-md px-4 py-3">
      <span className="flex items-center gap-1">
        <Dot /> <Dot delay={0.15} /> <Dot delay={0.3} />
      </span>
      {/* `key` remounts the span so each new word fades in. */}
      <span key={index} className="animate-fade-in text-ink-2 text-sm">
        {THINKING_PHRASES[index]}…
      </span>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="bg-ink-3 h-1.5 w-1.5 animate-bounce rounded-full"
      style={{ animationDelay: `${delay}s`, animationDuration: "0.9s" }}
    />
  );
}
