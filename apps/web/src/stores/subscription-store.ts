import { create } from "zustand";
import type { SubscriptionResponse } from "@repo/shared";
import { getSubscription } from "@/lib/api";

interface SubscriptionState {
  data: SubscriptionResponse | null;
  loaded: boolean;
  load: () => Promise<void>;
  /** Replace with a fresh server response (returned by upgrade/downgrade/usage calls). */
  set: (data: SubscriptionResponse) => void;
}

let inFlight: Promise<void> | null = null;

/**
 * Backend-owned billing/usage state. Loaded once on the dashboard; every
 * mutation (upgrade, downgrade, chat/email usage) returns the fresh
 * SubscriptionResponse which callers push back in via `set`, so this stays
 * authoritative without polling.
 */
export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  data: null,
  loaded: false,
  load: async () => {
    if (inFlight) return inFlight;
    inFlight = (async () => {
      try {
        const data = await getSubscription();
        set({ data, loaded: true });
      } catch {
        set({ loaded: true });
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  },
  set: (data) => set({ data }),
}));
