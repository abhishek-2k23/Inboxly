import { create } from "zustand";
import type { IntegrationStatusResponse } from "@repo/shared";
import { getIntegrationStatus } from "@/lib/api";

interface AuthState {
  /** Gmail / Google Calendar connection status via Corsair, null until first load. */
  integrations: IntegrationStatusResponse | null;
  loaded: boolean;
  error: boolean;
  loadIntegrations: () => Promise<void>;
}

let inFlight: Promise<void> | null = null;

/**
 * Tracks third-party (Gmail / Google Calendar) connection status. Sign-in
 * state itself is owned by Clerk - see `useAuth()` for the combined view.
 */
export const useAuthStore = create<AuthState>((set) => ({
  integrations: null,
  loaded: false,
  error: false,

  loadIntegrations: async () => {
    if (inFlight) return inFlight;
    inFlight = (async () => {
      try {
        const integrations = await getIntegrationStatus();
        set({ integrations, loaded: true, error: false });
      } catch {
        set({ loaded: true, error: true });
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  },
}));
