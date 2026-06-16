import type { EmailSummary } from "@repo/shared";
import { matchesCategory, type InboxCategory } from "@/lib/ui";

/**
 * Inbox filter tabs. Gmail-style categories that the backend label data can
 * back are mapped to an {@link InboxCategory}; Sent and Archive are backed by
 * their own live-fetched lists (see `useEmailStore`); Drafts has no data
 * source yet and renders a "not available" empty state.
 */
export type InboxTab = "All" | "Primary" | "Sent" | "Promotions" | "Drafts" | "Archive";

export const INBOX_TABS: InboxTab[] = ["All", "Primary", "Sent", "Promotions", "Drafts", "Archive"];

/** Maps a label-backed tab to its category filter; null = backed some other way (or unsupported). */
const TAB_CATEGORY: Record<InboxTab, InboxCategory | null> = {
  All: "All",
  Primary: "Primary",
  Promotions: "Promotions",
  Sent: null,
  Drafts: null,
  Archive: null,
};

const UNSUPPORTED_TABS: ReadonlySet<InboxTab> = new Set(["Drafts"]);

export function isTabSupported(tab: InboxTab): boolean {
  return !UNSUPPORTED_TABS.has(tab);
}

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
  if (!isTabSupported(tab)) {
    return {
      title: `${tab} isn't available yet`,
      description: "This view will light up once Inboxly supports it. Hang tight.",
    };
  }
  return {
    title: "You're all caught up",
    description: "There's nothing in this view right now. Sync to pull the latest.",
  };
}
