import { create } from "zustand";
import type {
  GoogleIntegrationPlugin,
  IntegrationConnectionState,
  IntegrationStatusResponse,
} from "@repo/shared";
import { getIntegrationStatus } from "@/lib/api";

interface AuthState {
  /** Gmail / Google Calendar connection status via Corsair, null until first load. */
  integrations: IntegrationStatusResponse | null;
  loaded: boolean;
  error: boolean;
  loadIntegrations: () => Promise<void>;
  /** Optimistically update a single integration without refetching (used after a popup connect). */
  setIntegration: (plugin: GoogleIntegrationPlugin, state: IntegrationConnectionState) => void;
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

  setIntegration: (plugin, state) =>
    set((current) => ({
      integrations: {
        gmail: current.integrations?.gmail ?? "not_connected",
        googlecalendar: current.integrations?.googlecalendar ?? "not_connected",
        [plugin]: state,
      },
      loaded: true,
    })),
}));
