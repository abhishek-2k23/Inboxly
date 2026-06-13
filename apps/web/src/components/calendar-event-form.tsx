"use client";

import { useState } from "react";
import type { CalendarEventDateTime, CalendarEventInput, CalendarEventSummary } from "@repo/shared";

interface CalendarEventFormProps {
  initial?: CalendarEventSummary;
  onSubmit: (input: CalendarEventInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel: string;
  isSubmitting: boolean;
}

const FIELD_CLASS =
  "rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500";

function splitDateTime(value?: CalendarEventDateTime): {
  date: string;
  time: string;
  allDay: boolean;
} {
  if (value?.date) return { date: value.date, time: "", allDay: true };
  if (value?.dateTime) {
    const [date, time] = value.dateTime.split("T");
    return { date: date ?? "", time: (time ?? "").slice(0, 5), allDay: false };
  }
  return { date: "", time: "", allDay: false };
}

export function CalendarEventForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
  isSubmitting,
}: CalendarEventFormProps) {
  const startInitial = splitDateTime(initial?.start);
  const endInitial = splitDateTime(initial?.end);

  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [allDay, setAllDay] = useState(startInitial.allDay || endInitial.allDay);
  const [startDate, setStartDate] = useState(startInitial.date);
  const [startTime, setStartTime] = useState(startInitial.time || "09:00");
  const [endDate, setEndDate] = useState(endInitial.date);
  const [endTime, setEndTime] = useState(endInitial.time || "10:00");
  const [attendees, setAttendees] = useState(
    (initial?.attendees ?? [])
      .map((attendee) => attendee.email)
      .filter((email): email is string => Boolean(email))
      .join(", "),
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!summary.trim()) {
      setError("Title is required.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Start and end dates are required.");
      return;
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const start: CalendarEventDateTime = allDay
      ? { date: startDate }
      : { dateTime: `${startDate}T${startTime || "00:00"}:00`, timeZone };
    const end: CalendarEventDateTime = allDay
      ? { date: endDate }
      : { dateTime: `${endDate}T${endTime || "00:00"}:00`, timeZone };

    const attendeeList = attendees
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean)
      .map((email) => ({ email }));

    try {
      await onSubmit({
        summary: summary.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        start,
        end,
        attendees: attendeeList.length > 0 ? attendeeList : undefined,
      });
    } catch {
      setError("Failed to save the event.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">Title</label>
        <input
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Event title"
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">Description</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Details about the event"
          rows={2}
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">Location</label>
        <input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Location"
          className={FIELD_CLASS}
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-400">
        <input
          type="checkbox"
          checked={allDay}
          onChange={(event) => setAllDay(event.target.checked)}
        />
        All-day event
      </label>

      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs text-slate-400">Start</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className={`flex-1 ${FIELD_CLASS}`}
            />
            {!allDay && (
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className={FIELD_CLASS}
              />
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs text-slate-400">End</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className={`flex-1 ${FIELD_CLASS}`}
            />
            {!allDay && (
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className={FIELD_CLASS}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400">Attendees (comma-separated emails)</label>
        <input
          value={attendees}
          onChange={(event) => setAttendees(event.target.value)}
          placeholder="alice@example.com, bob@example.com"
          className={FIELD_CLASS}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium transition hover:border-slate-500"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
