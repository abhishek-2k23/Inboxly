"use client";

import { avatarColor, cn, initials, PRIORITY_COLOR, type Priority } from "@/lib/ui";

/**
 * Icon-only action button with a hover tooltip that surfaces its keyboard
 * shortcut. Icons-over-text is a core Inboxly UX principle.
 */
export function IconButton({
  icon,
  label,
  shortcut,
  onClick,
  accent = false,
  active = false,
  disabled = false,
  size = "md",
  type = "button",
}: {
  icon: string;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  accent?: boolean;
  active?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
  type?: "button" | "submit";
}) {
  return (
    <span className="group/icbtn relative inline-flex">
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius-ctl)] transition-colors disabled:opacity-40",
          size === "sm" ? "h-7 w-7" : "h-9 w-9",
          accent
            ? "bg-accent text-accent-ink hover:bg-accent-light"
            : active
              ? "bg-accent-fill text-accent-light"
              : "text-ink-2 hover:bg-surface-hover hover:text-ink",
        )}
      >
        <i className={cn("ti", icon)} aria-hidden />
      </button>
      <span
        role="tooltip"
        className="bg-surface text-ink-2 hairline pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-ctl)] px-2 py-1 text-xs group-hover/icbtn:block"
      >
        {label}
        {shortcut && <span className="text-ink-3 ml-2">{shortcut}</span>}
      </span>
    </span>
  );
}

export function PriorityDot({
  priority,
  filled = false,
  size = 8,
}: {
  priority: Priority;
  filled?: boolean;
  size?: number;
}) {
  const color = PRIORITY_COLOR[priority];
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: filled ? color : "transparent",
        border: filled ? "none" : `1.5px solid ${color}`,
      }}
      aria-hidden
    />
  );
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: avatarColor(name),
        fontSize: size * 0.36,
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

/** Subtle 3-dot pulse used everywhere instead of spinners. */
export function ThinkingDots({ label }: { label?: string }) {
  return (
    <span className="text-ink-2 inline-flex items-center gap-2">
      <span className="inline-flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="thinking-dot bg-ink-2 inline-block h-1.5 w-1.5 rounded-full"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </span>
      {label && <span className="text-xs">{label}</span>}
    </span>
  );
}

export function Pill({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-accent-fill text-accent-light"
          : "text-ink-2 hover:bg-surface-hover hover:text-ink hairline",
      )}
    >
      {children}
    </button>
  );
}

/** Suggestion chip below the prompt bar. */
export function Chip({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-surface text-ink-2 hairline hover:text-ink flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors"
    >
      {children}
    </button>
  );
}
