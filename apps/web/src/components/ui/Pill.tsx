import type { ReactNode } from "react";
import { cn } from "@/lib/ui";

/** Small pill-shaped label, e.g. the hero eyebrow and "Most Popular" tag. */
export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "bg-surface text-ink-2 hairline inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}
