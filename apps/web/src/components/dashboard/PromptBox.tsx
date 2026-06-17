"use client";

import { ArrowUp, Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { cn } from "@/lib/ui";

/**
 * The prompt input. The only deliberately accented surface in the dashboard:
 * a thin indigo gradient ring with a soft glow on focus. Auto-grows up to a few
 * lines; Enter sends, Shift+Enter inserts a newline.
 */
export function PromptBox({
  value,
  onChange,
  onSubmit,
  disabled,
  autoFocus,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [interimText, setInterimText] = useState("");

  const { voiceState, isSupported, toggle } = useVoiceInput({
    onTranscript: (text) => {
      setInterimText("");
      onChange(value ? `${value} ${text}` : text);
    },
    onInterim: (text) => {
      setInterimText(text);
    },
  });

  const isListening = voiceState === "listening";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  // Stop voice input when the component is disabled (e.g. message sending)
  useEffect(() => {
    if (disabled && isListening) {
      toggle();
    }
  }, [disabled, isListening, toggle]);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (disabled || !value.trim()) return;
    onSubmit();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const displayValue =
    isListening && interimText ? `${value}${value ? " " : ""}${interimText}` : value;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <form
        onSubmit={submit}
        className={cn(
          "group rounded-2xl p-[1.5px] transition-shadow duration-300",
          isListening
            ? "shadow-[0_0_0_4px_rgba(239,68,68,0.15),0_10px_34px_-14px_rgba(239,68,68,0.4)] [background:linear-gradient(135deg,rgba(239,68,68,0.65),rgba(239,68,68,0.12)_55%,rgba(239,68,68,0.45))]"
            : "[background:linear-gradient(135deg,rgba(99,102,241,0.65),rgba(99,102,241,0.12)_55%,rgba(99,102,241,0.45))] focus-within:shadow-[0_0_0_4px_var(--color-primary-soft),0_10px_34px_-14px_rgba(99,102,241,0.55)]",
        )}
      >
        <div className="bg-panel flex items-end gap-2 rounded-[14.5px] px-3 py-2.5">
          <textarea
            ref={ref}
            rows={1}
            value={displayValue}
            autoFocus={autoFocus}
            disabled={disabled}
            onChange={(e) => {
              if (!isListening) onChange(e.target.value);
            }}
            onKeyDown={onKeyDown}
            placeholder={isListening ? "Listening…" : "Ask Inboxly anything…"}
            className={cn(
              "text-ink max-h-[200px] flex-1 resize-none bg-transparent py-1.5 text-sm leading-relaxed focus:outline-none disabled:opacity-60",
              isListening ? "placeholder:text-red-400" : "placeholder:text-ink-3",
              isListening && interimText && "text-ink-2 italic",
            )}
          />

          <button
            type="button"
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
            title={
              !isSupported
                ? "Voice input not supported in this browser"
                : isListening
                  ? "Stop listening"
                  : "Voice input"
            }
            disabled={!isSupported || disabled}
            onClick={toggle}
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors",
              isListening
                ? "animate-pulse bg-red-500/10 text-red-500 hover:bg-red-500/20"
                : "text-ink-3 hover:text-ink hover:bg-surface-hover",
              !isSupported && "cursor-not-allowed opacity-30",
            )}
          >
            {isListening ? (
              <MicOff className="h-[18px] w-[18px]" />
            ) : (
              <Mic className="h-[18px] w-[18px]" />
            )}
          </button>

          <button
            type="submit"
            aria-label="Send"
            disabled={disabled || !value.trim()}
            className="bg-accent text-accent-ink hover:bg-accent-light grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors disabled:opacity-40"
          >
            <ArrowUp className="h-[18px] w-[18px]" />
          </button>
        </div>
      </form>

      {isListening && (
        <p className="flex items-center gap-1.5 px-1 text-xs text-red-400">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          Listening… speak now
        </p>
      )}
    </div>
  );
}
