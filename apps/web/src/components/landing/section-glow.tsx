import { cn } from "@/lib/ui";

/**
 * Static accent-tinted glow used to break up the flat page background across
 * sections. Alternates corners so neighboring sections don't stack glows in
 * the same spot.
 */
export function SectionGlow({ variant }: { variant: "odd" | "even" }) {
  return (
    <div
      aria-hidden
      className={cn(
        "bg-accent pointer-events-none absolute h-72 w-72 rounded-full opacity-10 blur-[100px]",
        variant === "odd" ? "-right-24 -top-24" : "-bottom-24 -left-24",
      )}
    />
  );
}
