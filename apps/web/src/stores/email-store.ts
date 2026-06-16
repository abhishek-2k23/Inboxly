import { create } from "zustand";
import type { EmailSummary } from "@repo/shared";
import { listArchivedEmails, listDrafts, listEmails, listSentEmails } from "@/lib/api";

interface EmailState {
  emails: EmailSummary[];
  loaded: boolean;
  loadEmails: () => Promise<void>;

  sentEmails: EmailSummary[];
  sentLoaded: boolean;
  loadSent: () => Promise<void>;

  archivedEmails: EmailSummary[];
  archivedLoaded: boolean;
  loadArchived: () => Promise<void>;

  draftEmails: EmailSummary[];
  draftsLoaded: boolean;
  loadDrafts: () => Promise<void>;

  /** Optimistically drops an email from the inbox cache, e.g. right after archiving it. */
  removeFromInbox: (id: string) => void;
  /** Optimistically prepends a freshly-archived email into the Archive tab's cache. */
  addToArchived: (email: EmailSummary) => void;
  /** Optimistically drops a draft from the Drafts tab's cache, e.g. right after sending or discarding it. */
  removeDraft: (draftId: string) => void;
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

/**
 * Merges freshly-fetched entries into what's already known, keyed by `id`
 * (or `draftId` for drafts), instead of replacing the cache outright. Gmail's
 * search index / label propagation can lag a few seconds behind a just-made
 * change (e.g. archiving), so a plain overwrite here would clobber an
 * optimistic update with a fetch that hasn't caught up yet.
 */
function mergeByKey(
  existing: EmailSummary[],
  fetched: EmailSummary[],
  key: (email: EmailSummary) => string,
): EmailSummary[] {
  const merged = new Map(existing.map((e) => [key(e), e]));
  for (const e of fetched) merged.set(key(e), e);
  return sortByNewest([...merged.values()]);
}

let inFlight: Promise<void> | null = null;
let sentInFlight: Promise<void> | null = null;
let archivedInFlight: Promise<void> | null = null;
let draftsInFlight: Promise<void> | null = null;

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

  sentEmails: [],
  sentLoaded: false,

  // Sent/Archived/Drafts have no local sync cache (Gmail is fetched live), so
  // this is called lazily when the user opens those tabs rather than on mount.
  loadSent: async () => {
    if (sentInFlight) return sentInFlight;
    sentInFlight = (async () => {
      try {
        const { emails } = await listSentEmails({ limit: 100 });
        set((state) => ({
          sentEmails: mergeByKey(state.sentEmails, emails, (e) => e.id),
          sentLoaded: true,
        }));
      } catch {
        if (!get().sentLoaded) set({ sentLoaded: true });
      } finally {
        sentInFlight = null;
      }
    })();
    return sentInFlight;
  },

  archivedEmails: [],
  archivedLoaded: false,

  loadArchived: async () => {
    if (archivedInFlight) return archivedInFlight;
    archivedInFlight = (async () => {
      try {
        const { emails } = await listArchivedEmails({ limit: 100 });
        set((state) => ({
          archivedEmails: mergeByKey(state.archivedEmails, emails, (e) => e.id),
          archivedLoaded: true,
        }));
      } catch {
        if (!get().archivedLoaded) set({ archivedLoaded: true });
      } finally {
        archivedInFlight = null;
      }
    })();
    return archivedInFlight;
  },

  draftEmails: [],
  draftsLoaded: false,

  loadDrafts: async () => {
    if (draftsInFlight) return draftsInFlight;
    draftsInFlight = (async () => {
      try {
        const { emails } = await listDrafts({ limit: 100 });
        set((state) => ({
          draftEmails: mergeByKey(state.draftEmails, emails, (e) => e.draftId ?? e.id),
          draftsLoaded: true,
        }));
      } catch {
        if (!get().draftsLoaded) set({ draftsLoaded: true });
      } finally {
        draftsInFlight = null;
      }
    })();
    return draftsInFlight;
  },

  removeFromInbox: (id) => {
    set((state) => ({ emails: state.emails.filter((e) => e.id !== id) }));
  },

  addToArchived: (email) => {
    set((state) => ({
      archivedEmails: sortByNewest([
        email,
        ...state.archivedEmails.filter((e) => e.id !== email.id),
      ]),
    }));
  },

  removeDraft: (draftId) => {
    set((state) => ({
      draftEmails: state.draftEmails.filter((e) => e.draftId !== draftId),
    }));
  },
}));
