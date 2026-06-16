"use client";

import {
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  HelpCircle,
  MapPin,
  Trash2,
  Video,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import type { CalendarEventAttendee, CalendarEventSummary } from "@repo/shared";
import { FormattedText } from "@/components/shared/FormattedText";
import { avatarColor, cn, eventEnd, eventStart, initials, isAllDay } from "@/lib/ui";

const RESPONSE_ICON: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  accepted: { icon: CheckCircle2, color: "var(--color-success)", label: "Accepted" },
  declined: { icon: XCircle, color: "var(--color-danger)", label: "Declined" },
  tentative: { icon: HelpCircle, color: "var(--color-warning)", label: "Maybe" },
  needsAction: { icon: Circle, color: "var(--color-ink-3)", label: "Awaiting response" },
};

function fullEventTime(event: CalendarEventSummary): string {
  const start = eventStart(event);
  if (!start) return "";
  const dateLabel = start.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  if (isAllDay(event)) return `${dateLabel} · All day`;
  const end = eventEnd(event);
  const startStr = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const endStr = end?.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return endStr ? `${dateLabel} · ${startStr} – ${endStr}` : `${dateLabel} · ${startStr}`;
}

function AttendeeRow({ attendee }: { attendee: CalendarEventAttendee }) {
  const name = attendee.displayName?.trim() || attendee.email || "Guest";
  const status =
    RESPONSE_ICON[attendee.responseStatus ?? "needsAction"] ?? RESPONSE_ICON.needsAction!;
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center gap-2.5 py-1">
      <span
        aria-hidden
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.65rem] font-semibold text-white"
        style={{ backgroundColor: avatarColor(attendee.email ?? name) }}
      >
        {initials(name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-ink block truncate text-sm">{name}</span>
        {attendee.organizer && <span className="text-ink-3 text-[0.7rem]">Organizer</span>}
      </span>
      <span title={status.label}>
        <StatusIcon className="h-4 w-4 shrink-0" style={{ color: status.color }} />
      </span>
    </div>
  );
}

/** Read-only event details with quick actions: Join Meet, open in Google Calendar, delete. */
export function EventDetailModal({
  event,
  onClose,
  onDelete,
  isDeleting,
}: {
  event: CalendarEventSummary | null;
  onClose: () => void;
  onDelete: (event: CalendarEventSummary) => void;
  isDeleting: boolean;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!event) return null;
  const title = event.summary?.trim() || "(no title)";
  const accent = avatarColor(event.id);
  const attendees = event.attendees ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />

      <div className="border-line bg-panel relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border shadow-2xl">
        <div className="flex items-start gap-3 px-5 pt-5">
          <span
            aria-hidden
            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-ink text-lg font-semibold leading-snug">{title}</h2>
            {event.status === "cancelled" && (
              <span className="text-danger mt-1 inline-block text-xs font-medium">Cancelled</span>
            )}
            {event.status === "tentative" && (
              <span className="text-warning mt-1 inline-block text-xs font-medium">Tentative</span>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-ink-3 hover:bg-surface hover:text-ink grid h-8 w-8 shrink-0 place-items-center rounded-md transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <Clock className="text-ink-3 mt-0.5 h-4 w-4 shrink-0" />
              <span className="text-ink-2">{fullEventTime(event)}</span>
            </div>

            {event.location && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="text-ink-3 mt-0.5 h-4 w-4 shrink-0" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:text-accent-light"
                >
                  {event.location}
                </a>
              </div>
            )}

            {event.hangoutLink && (
              <div className="flex items-start gap-3 text-sm">
                <Video className="text-ink-3 mt-0.5 h-4 w-4 shrink-0" />
                <a
                  href={event.hangoutLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:text-accent-light font-medium"
                >
                  Join Google Meet
                </a>
              </div>
            )}
          </div>

          {event.description && (
            <div className="mt-4 border-t pt-4">
              <FormattedText text={event.description} />
            </div>
          )}

          {attendees.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <p className="text-ink-3 mb-1 text-xs font-medium uppercase tracking-wide">
                {attendees.length} guest{attendees.length === 1 ? "" : "s"}
              </p>
              {attendees.map((a) => (
                <AttendeeRow key={a.email ?? a.id ?? a.displayName} attendee={a} />
              ))}
            </div>
          )}
        </div>

        <div className="border-line flex shrink-0 items-center justify-between gap-2 border-t px-5 py-3.5">
          {event.htmlLink ? (
            <a
              href={event.htmlLink}
              target="_blank"
              rel="noreferrer"
              className="border-line text-ink-2 hover:bg-surface-hover inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in Calendar
            </a>
          ) : (
            <span />
          )}

          {confirmingDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-ink-3 text-xs">Delete this event?</span>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="text-ink-2 hover:bg-surface-hover h-8 rounded-md px-2.5 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => onDelete(event)}
                className="bg-danger inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-white transition-colors disabled:opacity-60"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className={cn(
                "text-ink-3 hover:bg-surface hover:text-danger grid h-9 w-9 place-items-center rounded-lg transition-colors",
              )}
              aria-label="Delete event"
              title="Delete event"
            >
              <Trash2 className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
