import { create } from "zustand";
import type { EmailSummary } from "@repo/shared";
import { listEmails } from "@/lib/api";

interface EmailState {
  emails: EmailSummary[];
  loaded: boolean;
  loadEmails: () => Promise<void>;
}

/** Epoch millis for sorting; messages with no parseable date sink to the bottom. */
function dateValue(internalDate?: string | null): number {
  if (!internalDate) return 0;
  const ts = /^\d+$/.test(internalDate) ? Number(internalDate) : Date.parse(internalDate);
  return Number.isFinite(ts) ? ts : 0;
}

/** Newest first - the default inbox ordering. */
function sortByNewest(emails: EmailSummary[]): EmailSummary[] {
  return [...emails].sort((a, b) => dateValue(b.internalDate) - dateValue(a.internalDate));
}

let inFlight: Promise<void> | null = null;

/**
 * Shared inbox cache. Because it lives in a Zustand store outside the
 * component tree, the fetched list survives navigation between tabs and
 * in/out of an email - the inbox stays stable instead of flashing a skeleton
 * and re-ordering on every mount. The list is always kept newest-first.
 */
export const useEmailStore = create<EmailState>((set, get) => ({
  emails: [],
  loaded: false,

  // Safe to call on every mount: the existing list is retained (so navigating
  // back is instant), it's refreshed in the background, and concurrent
  // callers share a single request.
  loadEmails: async () => {
    if (inFlight) return inFlight;
    inFlight = (async () => {
      try {
        const { emails } = await listEmails({ limit: 100 });
        set({ emails: sortByNewest(emails), loaded: true });
      } catch {
        // Keep whatever we already had; just leave the skeleton on first load.
        if (!get().loaded) set({ loaded: true });
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  },
}));
