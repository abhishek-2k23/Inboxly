"use client";

import { cn } from "@/lib/ui";

export function ViewToggle({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-xs transition-colors",
        active ? "bg-accent-fill text-accent-light" : "text-ink-2 hover:text-ink",
      )}
    >
      <i className={cn("ti", icon)} aria-hidden />
      {label}
    </button>
  );
}
