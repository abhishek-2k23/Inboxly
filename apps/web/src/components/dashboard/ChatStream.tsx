"use client";

import { CalendarCheck, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTypewriter } from "@/hooks/use-typewriter";
import type { ChatStoreMessage } from "@/stores/chat-store";

export function ChatStream({
  messages,
  sending,
  streamingId,
  onStreamDone,
}: {
  messages: ChatStoreMessage[];
  sending: boolean;
  streamingId: string | null;
  onStreamDone: () => void;
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
        />
      ))}

      {awaitingReply && (
        <div className="flex items-start gap-3">
          <AgentAvatar />
          <div className="bg-surface flex items-center gap-1 rounded-2xl rounded-tl-md px-4 py-3">
            <Dot /> <Dot delay={0.15} /> <Dot delay={0.3} />
          </div>
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
}: {
  message: ChatStoreMessage;
  streaming: boolean;
  onStreamDone: () => void;
}) {
  const { shown, done } = useTypewriter(message.content, streaming, onStreamDone);

  if (message.role === "user") {
    return (
      <div className="animate-rise-in flex justify-end">
        <div className="bg-accent text-accent-ink max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tr-md px-4 py-2.5 text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise-in flex items-start gap-3">
      <AgentAvatar />
      <div className="min-w-0 flex-1">
        <div className="text-ink whitespace-pre-wrap text-sm leading-relaxed">
          {shown}
          {streaming && !done && <span className="stream-caret align-middle" />}
        </div>
        {message.events && message.events.length > 0 && (
          <div className="mt-3 flex flex-col gap-1.5">
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
      </div>
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

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="bg-ink-3 h-1.5 w-1.5 animate-bounce rounded-full"
      style={{ animationDelay: `${delay}s`, animationDuration: "0.9s" }}
    />
  );
}
