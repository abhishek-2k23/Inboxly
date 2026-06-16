import type { ReactNode } from "react";
import { cn } from "@/lib/ui";
import { Reveal } from "./Reveal";

/** Centered section title + optional eyebrow / subtitle, used across the page. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}) {
  return (
    <Reveal className={cn("mx-auto max-w-2xl text-center", className)}>
      {eyebrow && (
        <p className="text-ink-3 text-sm font-medium uppercase tracking-wide">{eyebrow}</p>
      )}
      <h2 className="text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="text-ink-2 mx-auto mt-3 max-w-xl text-pretty">{subtitle}</p>}
    </Reveal>
  );
}
