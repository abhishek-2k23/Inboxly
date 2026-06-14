"use client";

import { useEffect } from "react";
import { subscribeToEmailUpdates } from "@/lib/api";
import { useEmailStore } from "@/stores/email-store";
import { useAuth } from "@/hooks/use-auth";

/**
 * Loads the shared inbox cache on mount and keeps it fresh via SSE while
 * signed in. Safe to call from multiple components (inbox list, email
 * detail) - the underlying store dedupes concurrent loads.
 */
export function useEmailSync() {
  const emails = useEmailStore((s) => s.emails);
  const loaded = useEmailStore((s) => s.loaded);
  const loadEmails = useEmailStore((s) => s.loadEmails);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    void loadEmails();
  }, [loadEmails]);

  useEffect(() => {
    if (!isSignedIn) return;
    return subscribeToEmailUpdates(() => void loadEmails());
  }, [isSignedIn, loadEmails]);

  return { emails, loaded, loadEmails };
}
