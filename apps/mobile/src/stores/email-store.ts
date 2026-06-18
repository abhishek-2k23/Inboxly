import { create } from "zustand";
import type { EmailSummary } from "@/types";
import { listEmails } from "@/lib/api";

interface EmailState {
  emails: EmailSummary[];
  loaded: boolean;
  loadEmails: () => Promise<void>;
}

function newestFirst(emails: EmailSummary[]): EmailSummary[] {
  return [...emails].sort((a, b) => {
    const ta = a.internalDate ? Number(a.internalDate) : 0;
    const tb = b.internalDate ? Number(b.internalDate) : 0;
    return tb - ta;
  });
}

let inFlight: Promise<void> | null = null;

export const useEmailStore = create<EmailState>((set, get) => ({
  emails: [],
  loaded: false,

  loadEmails: async () => {
    if (inFlight) return inFlight;
    inFlight = (async () => {
      try {
        const { emails } = await listEmails({ limit: 100 });
        set({ emails: newestFirst(emails), loaded: true });
      } catch {
        if (!get().loaded) set({ loaded: true });
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  },
}));
