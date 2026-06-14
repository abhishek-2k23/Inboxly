"use client";

import { useSyncExternalStore } from "react";
import type { EmailSummary } from "@repo/shared";
import { listEmails } from "./api";

/**
 * Module-level inbox cache shared across the `/app/*` routes. Because it lives
 * outside React's component tree, the fetched list survives navigation between
 * tabs and in/out of an email - so the inbox stays stable instead of flashing a
 * skeleton and re-ordering on every mount. The list is always kept newest-first.
 */

type EmailState = {
  emails: EmailSummary[];
  loaded: boolean;
};

let state: EmailState = { emails: [], loaded: false };
const listeners = new Set<() => void>();

function setState(next: EmailState): void {
  state = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): EmailState {
  return state;
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
 * Refreshes the shared inbox cache. Safe to call on every mount: the existing
 * list is retained (so navigating back is instant), it's refreshed in the
 * background, and concurrent callers share a single request.
 */
export async function loadEmails(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const { emails } = await listEmails({ limit: 100 });
      setState({ emails: sortByNewest(emails), loaded: true });
    } catch {
      // Keep whatever we already had; just leave the skeleton on first load.
      if (!state.loaded) setState({ ...state, loaded: true });
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Reactive view of the shared inbox cache. */
export function useEmails(): EmailState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
