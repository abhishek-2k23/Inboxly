"use client";

import { Video, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { CalendarEventInput } from "@repo/shared";
import { addDays } from "@/lib/calendar-utils";
import { cn } from "@/lib/ui";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeValue(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function roundToNextHour(d: Date): Date {
  const r = new Date(d);
  r.setMinutes(0, 0, 0);
  r.setHours(r.getHours() + 1);
  return r;
}

/** Small create-event form: title, all-day toggle, date/time, location, guests, description, Meet link. */
export function CreateEventModal({
  open,
  onClose,
  onCreate,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CalendarEventInput) => Promise<void>;
  defaultDate?: Date;
}) {
  const [title, setTitle] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [guests, setGuests] = useState("");
  const [description, setDescription] = useState("");
  const [addMeet, setAddMeet] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const base = defaultDate ?? new Date();
    const start = roundToNextHour(base);
    const end = new Date(start.getTime() + 60 * 60000);
    setTitle("");
    setAllDay(false);
    setStartDate(toDateValue(base));
    setStartTime(toTimeValue(start));
    setEndDate(toDateValue(base));
    setEndTime(toTimeValue(end));
    setLocation("");
    setGuests("");
    setDescription("");
    setAddMeet(false);
  }, [open, defaultDate]);

  if (!open) return null;

  async function handleSubmit() {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const attendees = guests
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean)
        .map((email) => ({ email }));

      const input: CalendarEventInput = {
        summary: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        attendees: attendees.length ? attendees : undefined,
        addMeetLink: addMeet || undefined,
        start: allDay
          ? { date: startDate }
          : { dateTime: new Date(`${startDate}T${startTime}`).toISOString() },
        end: allDay
          ? { date: toDateValue(addDays(new Date(`${endDate || startDate}T00:00:00`), 1)) }
          : { dateTime: new Date(`${endDate || startDate}T${endTime}`).toISOString() },
      };

      await onCreate(input);
      onClose();
    } catch {
      // useCalendarActions already toasts the failure.
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />

      <div className="border-line bg-panel relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border shadow-2xl">
        <div className="border-line flex h-12 shrink-0 items-center justify-between border-b px-4">
          <span className="text-ink text-sm font-medium">New event</span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-ink-3 hover:bg-surface hover:text-ink grid h-8 w-8 place-items-center rounded-md transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <input
            type="text"
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add title"
            className="text-ink placeholder:text-ink-3 w-full border-b bg-transparent pb-2 text-base font-medium outline-none"
          />

          <label className="text-ink-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="accent-accent h-4 w-4"
            />
            All day
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-ink-3 mb-1 text-xs font-medium">Starts</p>
              <div className="flex gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-line bg-surface text-ink min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-sm outline-none"
                />
                {!allDay && (
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="border-line bg-surface text-ink w-[6.5rem] shrink-0 rounded-lg border px-2 py-1.5 text-sm outline-none"
                  />
                )}
              </div>
            </div>
            <div>
              <p className="text-ink-3 mb-1 text-xs font-medium">Ends</p>
              <div className="flex gap-1.5">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-line bg-surface text-ink min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-sm outline-none"
                />
                {!allDay && (
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="border-line bg-surface text-ink w-[6.5rem] shrink-0 rounded-lg border px-2 py-1.5 text-sm outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add location"
            className="border-line bg-surface text-ink placeholder:text-ink-3 w-full rounded-lg border px-3 py-2 text-sm outline-none"
          />

          <input
            type="text"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            placeholder="Add guests (comma-separated emails)"
            className="border-line bg-surface text-ink placeholder:text-ink-3 w-full rounded-lg border px-3 py-2 text-sm outline-none"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description"
            rows={3}
            className="border-line bg-surface text-ink placeholder:text-ink-3 w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none"
          />

          <label className="text-ink-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={addMeet}
              onChange={(e) => setAddMeet(e.target.checked)}
              className="accent-accent h-4 w-4"
            />
            <Video className="h-4 w-4" />
            Add Google Meet video call
          </label>
        </div>

        <div className="border-line flex shrink-0 items-center justify-end gap-2 border-t px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="text-ink-2 hover:bg-surface-hover h-9 rounded-lg px-3.5 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!title.trim() || saving}
            onClick={handleSubmit}
            className={cn(
              "bg-accent text-accent-ink hover:bg-accent-light h-9 rounded-lg px-4 text-sm font-medium transition-colors",
              (!title.trim() || saving) && "opacity-60",
            )}
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
