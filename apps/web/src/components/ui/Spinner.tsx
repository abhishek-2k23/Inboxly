import { cn } from "@/lib/ui";

/** Minimal pulsing-dot spinner that inherits the current text color. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("animate-pulse-dot inline-block rounded-full bg-current", className)}
    />
  );
}
