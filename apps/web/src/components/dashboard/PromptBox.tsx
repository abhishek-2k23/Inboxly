"use client";

import { ArrowUp, Mic } from "lucide-react";
import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { useToast } from "@/components/toast";
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
  const toast = useToast();
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

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

  return (
    <form
      onSubmit={submit}
      className={cn(
        "group rounded-2xl p-[1.5px] transition-shadow duration-300",
        "[background:linear-gradient(135deg,rgba(99,102,241,0.65),rgba(99,102,241,0.12)_55%,rgba(99,102,241,0.45))]",
        "focus-within:shadow-[0_0_0_4px_var(--color-primary-soft),0_10px_34px_-14px_rgba(99,102,241,0.55)]",
        className,
      )}
    >
      <div className="bg-panel flex items-end gap-2 rounded-[14.5px] px-3 py-2.5">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          autoFocus={autoFocus}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask Inboxly anything…"
          className="text-ink placeholder:text-ink-3 max-h-[200px] flex-1 resize-none bg-transparent py-1.5 text-sm leading-relaxed focus:outline-none disabled:opacity-60"
        />

        <button
          type="button"
          aria-label="Voice input"
          title="Voice input — coming soon"
          onClick={() => toast.info("Voice input is coming soon.")}
          className="text-ink-3 hover:text-ink hover:bg-surface-hover grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors"
        >
          <Mic className="h-[18px] w-[18px]" />
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
  );
}
