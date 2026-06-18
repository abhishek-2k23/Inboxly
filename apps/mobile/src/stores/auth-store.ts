import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandSQLiteStorage } from "@/lib/sqlite-storage";

interface AuthState {
  /** Raw Clerk JWT — set after successful sign-in, cleared on sign-out. */
  token: string | null;
  userId: string | null;
  gmailConnected: boolean;
  calendarConnected: boolean;
  setToken: (token: string | null) => void;
  setUserId: (id: string | null) => void;
  setIntegrations: (gmail: boolean, calendar: boolean) => void;
  signOut: () => void;
}

/**
 * Auth state persisted to SQLite via the custom zustandSQLiteStorage adapter.
 * This means the user stays "signed in" across cold starts without a network call,
 * with Clerk validating the cached JWT on the first API request.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      gmailConnected: false,
      calendarConnected: false,

      setToken: (token) => set({ token }),
      setUserId: (userId) => set({ userId }),
      setIntegrations: (gmail, calendar) =>
        set({ gmailConnected: gmail, calendarConnected: calendar }),
      signOut: () =>
        set({ token: null, userId: null, gmailConnected: false, calendarConnected: false }),
    }),
    {
      name: "inboxly-auth",
      storage: createJSONStorage(() => zustandSQLiteStorage),
    },
  ),
);
