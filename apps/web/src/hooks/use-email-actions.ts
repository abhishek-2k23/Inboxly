"use client";

import { useState } from "react";
import { syncEmails } from "@/lib/api";
import { useToast } from "@/components/toast";
import { useEmailStore } from "@/stores/email-store";

/** Manual inbox sync with a toast and a background refresh of the shared cache. */
export function useEmailActions() {
  const toast = useToast();
  const loadEmails = useEmailStore((s) => s.loadEmails);
  const [isSyncing, setIsSyncing] = useState(false);

  async function handleSync() {
    if (isSyncing) return;
    setIsSyncing(true);
    const toastId = toast.loading("Syncing inbox…");
    try {
      const res = await syncEmails();
      await loadEmails();
      toast.success(`Synced ${res.synced} email${res.synced === 1 ? "" : "s"}`, toastId);
    } catch {
      toast.error("Sync failed. Is Gmail connected?", toastId);
    } finally {
      setIsSyncing(false);
    }
  }

  return { isSyncing, handleSync };
}
