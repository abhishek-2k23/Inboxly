"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EmailSearchResult, EmailSummary } from "@repo/shared";
import { searchEmails, syncEmails } from "@/lib/api";
import { useEmailSync } from "@/hooks/use-email-sync";
import { useCalendarStore } from "@/stores/calendar-store";
import {
  cn,
  emailPriority,
  INBOX_CATEGORIES,
  type InboxCategory,
  isUnread,
  matchesCategory,
  relativeTime,
  senderName,
} from "@/lib/ui";
import { CalendarSidebar } from "@/components/calendar-sidebar";
import { PromptBar } from "@/components/prompt-bar";
import { useToast } from "@/components/toast";
import { Avatar, IconButton, Pill, PriorityDot, ThinkingDots } from "@/components/ui";

const SUGGESTIONS = [
  "Summarize my unread emails",
  "Draft a reply to the latest email",
  "Schedule a 30-min sync tomorrow at 2 PM",
  "Find emails about invoices",
];

export default function InboxPage() {
  const router = useRouter();
  const toast = useToast();

  // Shared, navigation-persistent inbox cache (newest-first).
  const { emails, loaded, loadEmails } = useEmailSync();
  const loadEvents = useCalendarStore((s) => s.loadEvents);
  const [results, setResults] = useState<EmailSearchResult[] | null>(null);
  const [category, setCategory] = useState<InboxCategory>("All");
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selected, setSelected] = useState(0);
  const [archived, setArchived] = useState<Set<string>>(new Set());
  const [starred, setStarred] = useState<Set<string>>(new Set());

  const searchRef = useRef<HTMLInputElement>(null);

  // `/` focuses search (dispatched by the global shortcut layer).
  useEffect(() => {
    function onFocusSearch() {
      searchRef.current?.focus();
    }
    window.addEventListener("inboxly:focus-search", onFocusSearch);
    return () => window.removeEventListener("inboxly:focus-search", onFocusSearch);
  }, []);

  const source = results ?? emails;
  const visible = useMemo(
    () =>
      source.filter((e) => !archived.has(e.id) && (results ? true : matchesCategory(e, category))),
    [source, archived, results, category],
  );

  useEffect(() => {
    setSelected((s) => Math.min(s, Math.max(0, visible.length - 1)));
  }, [visible.length]);

  const archive = useCallback(
    (id: string) => {
      setArchived((prev) => new Set(prev).add(id));
      toast.success("Archived");
    },
    [toast],
  );

  const toggleStar = useCallback((id: string) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openEmail = useCallback(
    (id: string) => router.push(`/app/inbox/${encodeURIComponent(id)}`),
    [router],
  );

  // J/K/R/E list shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      )
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (visible.length === 0) return;

      switch (e.key) {
        case "j":
          e.preventDefault();
          setSelected((s) => Math.min(s + 1, visible.length - 1));
          break;
        case "k":
          e.preventDefault();
          setSelected((s) => Math.max(s - 1, 0));
          break;
        case "Enter":
          if (visible[selected]) openEmail(visible[selected].id);
          break;
        case "r":
          if (visible[selected]) openEmail(visible[selected].id);
          break;
        case "e":
          if (visible[selected]) archive(visible[selected].id);
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, selected, openEmail, archive]);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setResults(null);
      return;
    }
    setIsSearching(true);
    const toastId = toast.loading(`Searching “${q}”…`);
    try {
      const { results: r } = await searchEmails(q);
      setResults(r);
      toast.success(`${r.length} result${r.length === 1 ? "" : "s"}`, toastId);
    } catch {
      toast.error("Search failed. Is the API running?", toastId);
    } finally {
      setIsSearching(false);
    }
  }

  function clearSearch() {
    setQuery("");
    setResults(null);
  }

  async function handleSync() {
    setIsSyncing(true);
    const toastId = toast.loading("Syncing Gmail…");
    try {
      const res = await syncEmails();
      await loadEmails();
      toast.success(`Synced ${res.synced} email${res.synced === 1 ? "" : "s"}`, toastId);
    } catch {
      toast.error("Sync failed. Is Gmail connected?", toastId);
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="flex h-full min-h-0">
      <section className="flex min-w-0 flex-1 flex-col">
        {/* prompt bar (sticky top) */}
        <div className="bg-page hairline-b shrink-0 px-6 pb-3 pt-5">
          <PromptBar
            suggestions={SUGGESTIONS}
            onActivity={() => {
              void loadEmails();
              void loadEvents();
            }}
          />
        </div>

        {/* search + categories */}
        <div className="flex shrink-0 flex-col gap-3 px-6 py-3">
          <form onSubmit={runSearch} className="flex items-center gap-2">
            <div className="bg-surface hairline focus-within:border-accent flex flex-1 items-center gap-2 rounded-[var(--radius-ctl)] px-3 py-2">
              {isSearching ? (
                <ThinkingDots />
              ) : (
                <i className="ti ti-search text-ink-3" aria-hidden />
              )}
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by meaning…"
                className="text-ink placeholder:text-ink-3 min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
              {query && (
                <button type="button" onClick={clearSearch} aria-label="Clear search">
                  <i className="ti ti-x text-ink-3 hover:text-ink" aria-hidden />
                </button>
              )}
            </div>
            <IconButton icon="ti-adjustments" label="Advanced filters" />
            <IconButton
              icon="ti-refresh"
              label="Sync Gmail"
              onClick={handleSync}
              disabled={isSyncing}
            />
          </form>

          <div className="flex gap-2 overflow-x-auto">
            {results ? (
              <Pill active onClick={clearSearch}>
                <i className="ti ti-search mr-1" aria-hidden />
                Results · clear
              </Pill>
            ) : (
              INBOX_CATEGORIES.map((c) => (
                <Pill key={c} active={category === c} onClick={() => setCategory(c)}>
                  {c}
                </Pill>
              ))
            )}
          </div>
        </div>

        {/* email list */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-16">
          {!loaded && <ListSkeleton />}

          {loaded && visible.length === 0 && (
            <EmptyState onSync={handleSync} isSyncing={isSyncing} hasQuery={Boolean(results)} />
          )}

          <ul className="flex flex-col">
            {visible.map((email, idx) => (
              <EmailRow
                key={email.id}
                email={email}
                selected={idx === selected}
                starred={starred.has(email.id)}
                onSelect={() => setSelected(idx)}
                onOpen={() => openEmail(email.id)}
                onArchive={() => archive(email.id)}
                onStar={() => toggleStar(email.id)}
                similarity={
                  "similarity" in email ? (email as EmailSearchResult).similarity : undefined
                }
              />
            ))}
          </ul>
        </div>
      </section>

      <div className="hidden lg:flex">
        <CalendarSidebar />
      </div>
    </div>
  );
}

function EmailRow({
  email,
  selected,
  starred,
  onSelect,
  onOpen,
  onArchive,
  onStar,
  similarity,
}: {
  email: EmailSummary;
  selected: boolean;
  starred: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onArchive: () => void;
  onStar: () => void;
  similarity?: number;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const unread = isUnread(email);
  const name = senderName(email.from);

  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  return (
    <li ref={ref}>
      <div
        onClick={() => {
          onSelect();
          onOpen();
        }}
        className={cn(
          "group/row flex cursor-pointer items-center gap-3 rounded-[var(--radius-ctl)] px-3 py-3 transition-colors",
          selected ? "bg-surface-hover" : "hover:bg-surface",
        )}
      >
        <PriorityDot priority={emailPriority(email)} filled={unread} />
        <Avatar name={name} size={36} />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span
              className={cn("truncate text-sm", unread ? "text-ink font-medium" : "text-ink-2")}
            >
              {name}
            </span>
            {starred && <i className="ti ti-star-filled text-prio-medium text-xs" aria-hidden />}
            <span className="text-ink-3 ml-auto shrink-0 text-xs">
              {similarity !== undefined
                ? `${(similarity * 100).toFixed(0)}% match`
                : relativeTime(email.internalDate)}
            </span>
          </div>
          <span className={cn("truncate text-sm", unread ? "text-ink" : "text-ink-2")}>
            {email.subject || "(no subject)"}
          </span>
          <span className="text-ink-3 truncate text-xs">{email.snippet}</span>
        </div>

        {/* hover-reveal quick actions */}
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100">
          <span onClick={(e) => e.stopPropagation()}>
            <IconButton
              icon="ti-archive"
              label="Archive"
              shortcut="E"
              size="sm"
              onClick={onArchive}
            />
          </span>
          <span onClick={(e) => e.stopPropagation()}>
            <IconButton icon="ti-clock" label="Snooze" size="sm" />
          </span>
          <span onClick={(e) => e.stopPropagation()}>
            <IconButton
              icon={starred ? "ti-star-filled" : "ti-star"}
              label="Star"
              size="sm"
              active={starred}
              onClick={onStar}
            />
          </span>
        </div>
      </div>
    </li>
  );
}

function ListSkeleton() {
  return (
    <ul className="flex flex-col gap-1 px-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-3 py-3">
          <div className="skeleton h-9 w-9 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="skeleton h-3 w-1/3 rounded" />
            <div className="skeleton h-3 w-2/3 rounded" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({
  onSync,
  isSyncing,
  hasQuery,
}: {
  onSync: () => void;
  isSyncing: boolean;
  hasQuery: boolean;
}) {
  if (hasQuery) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <i className="ti ti-search-off text-ink-3 text-3xl" aria-hidden />
        <p className="text-ink-2 text-sm">No emails match that search.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <i className="ti ti-inbox text-ink-3 text-3xl" aria-hidden />
      <p className="text-ink-2 text-sm">Your inbox is empty here.</p>
      <p className="text-ink-3 max-w-xs text-xs">
        Sync Gmail to pull your messages, then try{" "}
        <span className="text-accent-light">“summarize my unread emails”</span> in the prompt bar.
      </p>
      <button
        type="button"
        onClick={onSync}
        disabled={isSyncing}
        className="bg-accent text-accent-ink hover:bg-accent-light mt-1 flex items-center gap-2 rounded-[var(--radius-ctl)] px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
      >
        <i className="ti ti-refresh" aria-hidden />
        {isSyncing ? "Syncing…" : "Sync Gmail"}
      </button>
    </div>
  );
}
