"use client";

import { Show } from "@clerk/nextjs";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { CalendarEventInput, CalendarEventSummary } from "@repo/shared";
import { CalendarEventForm } from "@/components/calendar-event-form";
import { deleteCalendarEvent, getCalendarEvent, updateCalendarEvent } from "@/lib/api";

function formatEventTime(event: CalendarEventSummary): string {
  const start = event.start?.dateTime ?? event.start?.date;
  const end = event.end?.dateTime ?? event.end?.date;
  if (!start) return "";
  return end ? `${start} – ${end}` : start;
}

export default function CalendarEventDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = decodeURIComponent(params.id);

  const [event, setEvent] = useState<CalendarEventSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { event: loaded } = await getCalendarEvent(id);
      setEvent(loaded);
    } catch {
      setError("Failed to load this event.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void handleLoad();
  }, [handleLoad]);

  async function handleUpdate(input: CalendarEventInput) {
    setIsSaving(true);
    setError(null);
    try {
      const { event: updated } = await updateCalendarEvent(id, input);
      setEvent(updated);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteCalendarEvent(id);
      router.push("/calendar");
    } catch {
      setError("Failed to delete this event.");
      setIsDeleting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-16">
      <header className="flex flex-col gap-2">
        <Link href="/calendar" className="text-sm text-indigo-400 hover:text-indigo-300">
          ← Back to calendar
        </Link>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Event Details</h1>
      </header>

      <Show when="signed-in">
        <section className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          {isLoading && <p className="text-sm text-slate-400">Loading...</p>}

          {!isLoading && !event && !error && (
            <p className="text-sm text-slate-500">Event not found.</p>
          )}

          {!isLoading && event && !isEditing && (
            <div className="flex flex-col gap-2 text-sm">
              <p className="text-lg font-medium text-slate-100">{event.summary || "(no title)"}</p>
              <p className="text-xs text-slate-500">{formatEventTime(event)}</p>
              {event.location && <p className="text-slate-400">Location: {event.location}</p>}
              {event.description && (
                <p className="whitespace-pre-wrap text-slate-400">{event.description}</p>
              )}
              {event.attendees && event.attendees.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-slate-500">Attendees:</p>
                  <ul className="list-inside list-disc text-slate-400">
                    {event.attendees.map((attendee) => (
                      <li key={attendee.email ?? attendee.id}>
                        {attendee.email ?? attendee.displayName}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {event.htmlLink && (
                <a
                  href={event.htmlLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  Open in Google Calendar
                </a>
              )}

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium transition hover:border-slate-500"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={isDeleting}
                  className="rounded-lg border border-red-900 px-4 py-2 text-sm font-medium text-red-400 transition hover:border-red-700 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          )}

          {!isLoading && event && isEditing && (
            <CalendarEventForm
              initial={event}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
              submitLabel="Save changes"
              isSubmitting={isSaving}
            />
          )}
        </section>
      </Show>
    </main>
  );
}
