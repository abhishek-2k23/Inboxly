"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { consumeEmailSyncUsage, PlanLimitError, syncEmails } from "@/lib/api";
import { useToast } from "@/components/toast";
import { useEmailStore } from "@/stores/email-store";
import { useSubscriptionStore } from "@/stores/subscription-store";

/** Manual inbox sync with a toast and a background refresh of the shared cache. */
export function useEmailActions() {
  const toast = useToast();
  const router = useRouter();
  const loadEmails = useEmailStore((s) => s.loadEmails);
  const [isSyncing, setIsSyncing] = useState(false);

  async function handleSync() {
    if (isSyncing) return;

    // Enforce the plan's email-sync cap from the cached subscription snapshot.
    const sub = useSubscriptionStore.getState().data;
    if (sub && sub.limits.emailSyncs >= 0 && sub.usage.emailSyncs >= sub.limits.emailSyncs) {
      toast.error(
        `You've reached your email sync limit (${sub.limits.emailSyncs}). Upgrade to continue.`,
      );
      router.push("/dashboard/settings/plan");
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
