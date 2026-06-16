import type { EmailSummary } from "@repo/shared";
import { matchesCategory, type InboxCategory } from "@/lib/ui";

/**
 * Inbox filter tabs. Gmail-style categories that the backend label data can
 * back are mapped to an {@link InboxCategory}; Sent, Drafts and Archive are
 * backed by their own live-fetched lists (see `useEmailStore`).
 */
export type InboxTab = "All" | "Primary" | "Sent" | "Promotions" | "Drafts" | "Archive";

export const INBOX_TABS: InboxTab[] = ["All", "Primary", "Sent", "Promotions", "Drafts", "Archive"];

/** Maps a label-backed tab to its category filter; null = backed some other way. */
const TAB_CATEGORY: Record<InboxTab, InboxCategory | null> = {
  All: "All",
  Primary: "Primary",
  Promotions: "Promotions",
  Sent: null,
  Drafts: null,
  Archive: null,
};

export function filterByTab(emails: EmailSummary[], tab: InboxTab): EmailSummary[] {
  const category = TAB_CATEGORY[tab];
  if (category === null) return [];
  return emails.filter((email) => matchesCategory(email, category));
}

/** Title + description shown when a tab has no emails to display. */
export function emptyStateFor(
  tab: InboxTab,
  searching: boolean,
): { title: string; description: string } {
  if (searching) {
    return {
      title: "No matching mail",
      description: "Try a different name, subject, or keyword.",
    };
  }
  if (tab === "Drafts") {
    return {
      title: "No drafts",
      description: "Messages you start writing and close before sending will show up here.",
    };
  }
  return {
    title: "You're all caught up",
    description: "There's nothing in this view right now. Sync to pull the latest.",
  };
}
