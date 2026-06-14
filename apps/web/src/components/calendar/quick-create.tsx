"use client";

import { useState } from "react";
import type { CalendarEventInput } from "@repo/shared";
import { cn } from "@/lib/ui";
import { IconButton } from "@/components/ui";

export function QuickCreate({
  date,
  onClose,
  onCreate,
}: {
  date: Date;
  onClose: () => void;
  onCreate: (input: CalendarEventInput) => Promise<void>;
}) {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const [title, setTitle] = useState("");
  const [day, setDay] = useState(dateStr);
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(30);
  const [guests, setGuests] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Add a title.");
      return;
    }
    setSaving(true);
    setError(null);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const startDate = new Date(`${day}T${time}:00`);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    const toLocal = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;
    const attendees = guests
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean)
      .map((email) => ({ email }));
    try {
      await onCreate({
        summary: title.trim(),
        start: { dateTime: toLocal(startDate), timeZone },
        end: { dateTime: toLocal(endDate), timeZone },
        attendees: attendees.length ? attendees : undefined,
      });
      onClose();
    } catch {
      setError("Couldn't create the event. Is Google Calendar connected?");
      setSaving(false);
    }
  }

  const FIELD =
    "rounded-[var(--radius-ctl)] bg-page px-3 py-2 text-sm text-ink outline-none hairline placeholder:text-ink-3 focus:border-accent";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-panel hairline flex w-full max-w-sm flex-col gap-3 rounded-[var(--radius-card)] p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-ink flex items-center gap-2 text-sm font-medium">
            <i className="ti ti-calendar-plus text-accent-light" aria-hidden />
            New event
          </h2>
          <IconButton icon="ti-x" label="Close" size="sm" onClick={onClose} />
        </div>

        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          className={FIELD}
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className={cn(FIELD, "flex-1")}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={FIELD}
          />
        </div>
        <div className="text-ink-2 flex items-center gap-2 text-xs">
          <span>Duration</span>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={cn(FIELD, "flex-1")}
          >
            {[15, 30, 45, 60, 90, 120].map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
        </div>
        <input
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          placeholder="Guests (comma-separated emails)"
          className={FIELD}
        />
        {error && <p className="text-prio-urgent text-xs">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="bg-accent text-accent-ink hover:bg-accent-light flex items-center justify-center gap-2 rounded-[var(--radius-ctl)] px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <i className="ti ti-send" aria-hidden />
          {saving ? "Sending invite…" : "Send invite"}
        </button>
      </form>
    </div>
  );
}
