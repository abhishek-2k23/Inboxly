"use client";

import type { PointerEvent, ReactNode } from "react";
import { useRef } from "react";
import { cn } from "@/lib/ui";

/**
 * Premium frosted card with a cursor-tracking accent spotlight and a gentle
 * hover lift. The workhorse surface for the landing sections — combines the
 * `card-premium` look with the `.spotlight` glow (see globals.css).
 */
export function SpotlightCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      className={cn(
        "card-premium spotlight rounded-2xl",
        "hover:border-line-strong hover:-translate-y-1",
        className,
      )}
    >
      {children}
    </div>
  );
}
