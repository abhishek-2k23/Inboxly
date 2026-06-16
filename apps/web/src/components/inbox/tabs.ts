import type { EmailSummary } from "@repo/shared";
import { matchesCategory, type InboxCategory } from "@/lib/ui";

/**
 * Inbox filter tabs. Gmail-style categories backed by the inbox label data.
 * Sent, Drafts and Archive are no longer tabs here — they're their own sidebar
 * destinations (see /dashboard/{sent,drafts,archive}).
 */
export type InboxTab = "All" | "Primary" | "Promotions";

export const INBOX_TABS: InboxTab[] = ["All", "Primary", "Promotions"];

/** Maps a tab to its category filter. */
const TAB_CATEGORY: Record<InboxTab, InboxCategory> = {
  All: "All",
  Primary: "Primary",
  Promotions: "Promotions",
};

export function filterByTab(emails: EmailSummary[], tab: InboxTab): EmailSummary[] {
  return emails.filter((email) => matchesCategory(email, TAB_CATEGORY[tab]));
}

/** Title + description shown when a tab has no emails to display. */
export function emptyStateFor(
  _tab: InboxTab,
  searching: boolean,
): { title: string; description: string } {
  if (searching) {
    return {
      title: "No matching mail",
      description: "Try a different name, subject, or keyword.",
    };
  }
  return {
    title: "You're all caught up",
    description: "There's nothing in this view right now. Sync to pull the latest.",
  };
}
