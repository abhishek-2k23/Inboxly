"use client";

import { ArrowUp, Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { cn } from "@/lib/ui";

const RX = 15; // SVG rect inner radius (outer div is rounded-2xl = 16px)
const DASH = 90; // length of the traveling neon line in px

/** Perimeter of a rounded-rectangle given outer width/height and the inner rect offset of 1px each side. */
function calcPerimeter(w: number, h: number): number {
  const sw = Math.max(0, w - 2 - 2 * RX);
  const sh = Math.max(0, h - 2 - 2 * RX);
  return 2 * (sw + sh) + 2 * Math.PI * RX;
}

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [interimText, setInterimText] = useState("");
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const { voiceState, isSupported, toggle } = useVoiceInput({
    onTranscript: (text) => {
      setInterimText("");
      onChange(value ? `${value} ${text}` : text);
    },
    onInterim: (text) => setInterimText(text),
  });

  const isListening = voiceState === "listening";

  // Auto-resize textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  // Track wrapper size so the SVG rect matches exactly
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ob = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r) setDims({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  useEffect(() => {
    if (disabled && isListening) toggle();
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

  // SVG border animation values
  const p = dims.w > 0 ? calcPerimeter(dims.w, dims.h) : 800;
  const gap = Math.max(1, p - DASH);
  // dasharray period = DASH + gap = p, so shifting by -p returns to the exact same visual — seamless loop
  const cycle = p;
  const dur = isListening ? "2s" : "3.5s";
  const baseRingColor = isListening ? "rgba(239,68,68,0.15)" : "rgba(139,92,246,0.15)";
  const grad = isListening
    ? { c1: "#ef4444", c2: "#f97316", c3: "#fbbf24" }
    : { c1: "#8b5cf6", c2: "#06b6d4", c3: "#ec4899" };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div ref={wrapRef} className="relative rounded-2xl">
        {/* SVG overlay: a line that travels around the exact border perimeter */}
        {dims.w > 0 && (
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0"
            width={dims.w}
            height={dims.h}
            style={{ overflow: "visible", zIndex: 10 }}
          >
            <defs>
              {/* Diagonal gradient so the line's color shifts as it rounds corners */}
              <linearGradient
                id="neon-line-grad"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2={dims.w}
                y2={dims.h}
              >
                <stop offset="0%" stopColor={grad.c1} />
                <stop offset="50%" stopColor={grad.c2} />
                <stop offset="100%" stopColor={grad.c3} />
              </linearGradient>
            </defs>

            {/* Faint static ring so the border is always visible */}
            <rect
              x={1}
              y={1}
              width={dims.w - 2}
              height={dims.h - 2}
              rx={RX}
              ry={RX}
              fill="none"
              stroke={baseRingColor}
              strokeWidth={1.5}
            />

            {/* Traveling neon line — stroke-dashoffset moves it around the path */}
            <rect
              x={1}
              y={1}
              width={dims.w - 2}
              height={dims.h - 2}
              rx={RX}
              ry={RX}
              fill="none"
              stroke="url(#neon-line-grad)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={`${DASH} ${gap}`}
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to={String(-cycle)}
                dur={dur}
                repeatCount="indefinite"
              />
            </rect>
          </svg>
        )}

        <form
          onSubmit={submit}
          className="bg-panel relative z-[1] flex items-end gap-2 rounded-2xl px-3 py-2.5"
        >
          <textarea
            ref={textareaRef}
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
              "max-h-[200px] flex-1 resize-none bg-transparent py-1.5 text-sm leading-relaxed focus:outline-none disabled:opacity-60",
              isListening
                ? "text-ink italic placeholder:text-orange-400"
                : "text-ink placeholder:text-ink-3",
              isListening && interimText && "text-ink-2",
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
                : "text-ink-3 hover:bg-surface-hover hover:text-ink",
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
        </form>
      </div>

      {isListening && (
        <p className="flex items-center gap-1.5 px-1 text-xs text-orange-400">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          Listening… speak now
        </p>
      )}
    </div>
  );
}
