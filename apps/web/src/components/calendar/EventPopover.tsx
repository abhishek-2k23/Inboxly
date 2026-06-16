import { MapPin, Users, Video } from "lucide-react";
import type { ReactNode } from "react";
import type { CalendarEventSummary } from "@repo/shared";
import { formatEventRange, isAllDay } from "@/lib/ui";
import { cn } from "@/lib/ui";

/**
 * Generic hover-to-reveal card. Positioning is intentionally simple
 * (anchored to the trigger's own box) rather than mouse-tracked - callers
 * pass `flip`/`align` based on the trigger's grid position so the card
 * never has to escape its row/column.
 */
export function HoverPopover({
  content,
  flip,
  align = "left",
  side = false,
  children,
}: {
  content: ReactNode;
  flip?: boolean;
  align?: "left" | "right";
  /** Open beside the trigger (left/right per `align`) instead of above/below. */
  side?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="group/hover relative h-full w-full">
      {children}
      <div
        className={cn(
          "border-line bg-panel ring-line/50 pointer-events-none absolute z-50 w-64 scale-95 rounded-xl border p-3.5 opacity-0 shadow-xl ring-1 transition-[opacity,transform] delay-150 duration-150 group-hover/hover:scale-100 group-hover/hover:opacity-100",
          side
            ? cn(
                flip ? "bottom-0" : "top-0",
                align === "right" ? "right-full mr-2 origin-right" : "left-full ml-2 origin-left",
              )
            : cn(
                flip ? "bottom-full mb-2 origin-bottom" : "top-full mt-2 origin-top",
                align === "right" ? "right-0" : "left-0",
              ),
        )}
      >
        {content}
      </div>
    </div>
  );
}

/** Short quick-look content shown inside a HoverPopover for a calendar event. */
export function EventQuickInfo({ event }: { event: CalendarEventSummary }) {
  const title = event.summary?.trim() || "(no title)";
  const guestCount = event.attendees?.length ?? 0;

  return (
    <div className="space-y-1.5">
      <p className="text-ink text-sm font-semibold leading-snug">{title}</p>
      <p className="text-ink-2 text-xs">{formatEventRange(event)}</p>
      {event.location && !isAllDay(event) && (
        <p className="text-ink-3 flex items-center gap-1.5 text-xs">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{event.location}</span>
        </p>
      )}
      {event.hangoutLink && (
        <p className="text-ink-3 flex items-center gap-1.5 text-xs">
          <Video className="h-3 w-3 shrink-0" />
          Google Meet
        </p>
      )}
      {guestCount > 0 && (
        <p className="text-ink-3 flex items-center gap-1.5 text-xs">
          <Users className="h-3 w-3 shrink-0" />
          {guestCount} guest{guestCount === 1 ? "" : "s"}
        </p>
      )}
      {event.description && (
        <p className="text-ink-3 line-clamp-2 text-xs leading-relaxed">{event.description}</p>
      )}
    </div>
  );
}
