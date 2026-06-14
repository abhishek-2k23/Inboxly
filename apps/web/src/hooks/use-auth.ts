"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Combined auth view: Clerk owns sign-in state, the auth store owns Gmail /
 * Google Calendar connection status (loaded once a user is signed in).
 */
export function useAuth() {
  const { isSignedIn, isLoaded } = useUser();
  const integrations = useAuthStore((s) => s.integrations);
  const integrationsLoaded = useAuthStore((s) => s.loaded);
  const integrationsError = useAuthStore((s) => s.error);
  const loadIntegrations = useAuthStore((s) => s.loadIntegrations);

  useEffect(() => {
    if (isSignedIn) void loadIntegrations();
  }, [isSignedIn, loadIntegrations]);

  return {
    isSignedIn: Boolean(isSignedIn),
    isLoaded,
    integrations,
    integrationsLoaded,
    integrationsError,
    gmailConnected: integrations?.gmail === "connected",
    calendarConnected: integrations?.googlecalendar === "connected",
    reloadIntegrations: loadIntegrations,
  };
}
