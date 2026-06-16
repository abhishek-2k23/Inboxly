"use client";

import { useEffect, useMemo, useState } from "react";
import type { EmailSummary } from "@repo/shared";
import { searchEmails } from "@/lib/api";
import { useEmailSync } from "@/hooks/use-email-sync";
import { useEmailActions } from "@/hooks/use-email-actions";
import { senderEmail } from "@/lib/ui";
import { CalendarSidebar } from "./CalendarSidebar";
import { ComposeModal } from "./ComposeModal";
import { EmailList } from "./EmailList";
import { EmailReader } from "./EmailReader";
import { InboxHeader } from "./InboxHeader";
import { emptyStateFor, filterByTab, type InboxTab } from "./tabs";

interface ComposeDraft {
  to?: string;
  subject?: string;
}

export function InboxView() {
  const { emails, loaded } = useEmailSync();
  const { isSyncing, handleSync } = useEmailActions();

  const [tab, setTab] = useState<InboxTab>("All");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EmailSummary[] | null>(null);
  const [searching, setSearching] = useState(false);

  const [selected, setSelected] = useState<EmailSummary | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [draft, setDraft] = useState<ComposeDraft | undefined>(undefined);

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

  function openReply(email: EmailSummary) {
    const re = email.subject?.trim();
    setDraft({
      to: senderEmail(email.from),
      subject: re ? (re.toLowerCase().startsWith("re:") ? re : `Re: ${re}`) : undefined,
    });
    setSelected(null);
    setComposeOpen(true);
  }

  function openCompose() {
    setDraft(undefined);
    setComposeOpen(true);
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
          onCompose={openCompose}
        />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <EmailList
            emails={visible}
            loading={listLoading}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
            emptyTitle={empty.title}
            emptyDescription={empty.description}
          />
        </div>
      </div>

      {/* Right: today's schedule */}
      <CalendarSidebar />

      {/* Overlays */}
      {selected && (
        <EmailReader email={selected} onClose={() => setSelected(null)} onReply={openReply} />
      )}
      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} draft={draft} />
    </div>
  );
}
