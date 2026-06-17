import { cn } from "@/lib/ui";

/** Ripple loader: concentric rings expanding outward, inheriting the current text color. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("ripple-loader inline-block", className)}
    >
      <span className="ripple-ring" />
      <span className="ripple-ring" />
    </span>
  );
}
