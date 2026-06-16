"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { consumeEmailSyncUsage, PlanLimitError, syncEmails } from "@/lib/api";
import { useToast } from "@/components/toast";
import { useEmailStore } from "@/stores/email-store";
import { useSubscriptionStore } from "@/stores/subscription-store";

/**
 * Manual sync with a toast and a background refresh of the shared caches.
 * The backend's `syncEmails` call refreshes Inbox, Sent, Archived, and
 * Drafts together (see emailService.syncAll), so all four local caches are
 * reloaded afterward too - cheap DB reads, no extra Gmail calls - instead of
 * just the inbox one.
 */
export function useEmailActions() {
  const toast = useToast();
  const router = useRouter();
  const loadEmails = useEmailStore((s) => s.loadEmails);
  const loadSent = useEmailStore((s) => s.loadSent);
  const loadArchived = useEmailStore((s) => s.loadArchived);
  const loadDrafts = useEmailStore((s) => s.loadDrafts);
  const [isSyncing, setIsSyncing] = useState(false);

  async function handleSync() {
    if (isSyncing) return;

    // Enforce the plan's email-sync cap from the cached subscription snapshot.
    const sub = useSubscriptionStore.getState().data;
    if (sub && sub.limits.emailSyncs >= 0 && sub.usage.emailSyncs >= sub.limits.emailSyncs) {
      toast.error(
        `You've reached your email sync limit (${sub.limits.emailSyncs}). Upgrade to continue.`,
      );
      router.push("/dashboard/billing");
      return;
    }

    setIsSyncing(true);
    const toastId = toast.loading("Syncing inbox…");
    try {
      const res = await syncEmails();
      try {
        useSubscriptionStore.getState().set(await consumeEmailSyncUsage());
      } catch (err) {
        if (err instanceof PlanLimitError) {
          toast.info("You've reached your plan limit. Upgrade for unlimited access.");
        }
      }
      await Promise.all([loadEmails(), loadSent(), loadArchived(), loadDrafts()]);
      toast.success(`Synced ${res.synced} email${res.synced === 1 ? "" : "s"}`, toastId);
    } catch {
      toast.error("Sync failed. Is Gmail connected?", toastId);
    } finally {
      setIsSyncing(false);
    }
  }

  return { isSyncing, handleSync };
}
