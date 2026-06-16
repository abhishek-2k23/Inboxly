"use client";

import { useState } from "react";
import type { CalendarEventInput } from "@repo/shared";
import { createCalendarEvent, deleteCalendarEvent, syncCalendar } from "@/lib/api";
import { useToast } from "@/components/toast";
import { useCalendarStore } from "@/stores/calendar-store";

/** Sync + create/delete-event mutations for the calendar page, with toasts and a refresh. */
export function useCalendarActions() {
  const toast = useToast();
  const loadEvents = useCalendarStore((s) => s.loadEvents);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSync() {
    setIsSyncing(true);
    const toastId = toast.loading("Syncing calendar…");
    try {
      const res = await syncCalendar();
      await loadEvents();
      toast.success(`Synced ${res.synced} event${res.synced === 1 ? "" : "s"}`, toastId);
    } catch {
      toast.error("Sync failed. Is Google Calendar connected?", toastId);
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleCreate(input: CalendarEventInput) {
    const toastId = toast.loading("Sending invite…");
    try {
      await createCalendarEvent(input);
      await loadEvents();
      toast.success(`“${input.summary ?? "Event"}” created`, toastId);
    } catch (e) {
      toast.error("Couldn't create the event. Is Google Calendar connected?", toastId);
      throw e;
    }
  }

  async function handleDelete(id: string, title?: string) {
    setIsDeleting(true);
    const toastId = toast.loading("Deleting event…");
    try {
      await deleteCalendarEvent(id);
      await loadEvents();
      toast.success(`“${title ?? "Event"}” deleted`, toastId);
    } catch (e) {
      toast.error("Couldn't delete the event.", toastId);
      throw e;
    } finally {
      setIsDeleting(false);
    }
  }

  return { isSyncing, handleSync, handleCreate, isDeleting, handleDelete };
}
