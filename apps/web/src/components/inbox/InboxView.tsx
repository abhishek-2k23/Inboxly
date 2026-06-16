"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { EmailSummary } from "@repo/shared";
import { searchEmails } from "@/lib/api";
import { useEmailSync } from "@/hooks/use-email-sync";
import { useEmailActions } from "@/hooks/use-email-actions";
import { CalendarSidebar } from "./CalendarSidebar";
import { ComposeModal, type ComposeDraft } from "./ComposeModal";
import { EmailList } from "./EmailList";
import { InboxHeader } from "./InboxHeader";
import { emptyStateFor, filterByTab, type InboxTab } from "./tabs";

export function InboxView() {
  const router = useRouter();
  const { emails, loaded } = useEmailSync();
  const { isSyncing, handleSync } = useEmailActions();

  const [tab, setTab] = useState<InboxTab>("All");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EmailSummary[] | null>(null);
  const [searching, setSearching] = useState(false);

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeDraft, setComposeDraft] = useState<ComposeDraft | undefined>(undefined);

  // Debounced semantic search; clears back to the tab-filtered list when empty.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const { results } = await searchEmails(q, 50);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const isSearch = query.trim().length > 0;

  const visible = useMemo(() => {
    if (isSearch) return searchResults ?? [];
    return filterByTab(emails, tab);
  }, [isSearch, searchResults, emails, tab]);

  const listLoading = isSearch ? searching && searchResults === null : !loaded;
  const empty = emptyStateFor(tab, isSearch);

  function handleSelect(email: EmailSummary) {
    router.push(`/dashboard/inbox/${email.id}`);
  }

  return (
    <div className="flex h-full min-w-0">
      {/* Center: inbox */}
      <div className="flex min-w-0 flex-1 flex-col">
        <InboxHeader
          query={query}
          onQueryChange={setQuery}
          tab={tab}
          onTabChange={setTab}
          onSync={handleSync}
          isSyncing={isSyncing}
          onCompose={() => {
            setComposeDraft(undefined);
            setComposeOpen(true);
          }}
        />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <EmailList
            emails={visible}
            loading={listLoading}
            selectedId={null}
            onSelect={handleSelect}
            emptyTitle={empty.title}
            emptyDescription={empty.description}
          />
        </div>
      </div>

      {/* Right: today's schedule */}
      <CalendarSidebar />

      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} draft={composeDraft} />
    </div>
  );
}
