"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { EmailSummary } from "@repo/shared";
import { cn } from "@/lib/ui";
import { EmailList } from "./EmailList";

/**
 * A standalone mail folder page (Sent / Drafts / Archive). These lists used to
 * live as tabs inside the inbox; each is now its own sidebar destination that
 * loads its cache on mount and renders the shared {@link EmailList}.
 */
export function MailFolderView({
  title,
  emails,
  loaded,
  load,
  onSelect,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  emails: EmailSummary[];
  loaded: boolean;
  load: () => Promise<void>;
  onSelect: (email: EmailSummary) => void;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header className="border-line flex h-16 shrink-0 items-center justify-between border-b px-5">
        <h1 className="text-ink text-lg font-semibold tracking-tight">{title}</h1>
        <button
          type="button"
          aria-label={`Refresh ${title}`}
          title={`Refresh ${title}`}
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-ink-2 hover:bg-surface hover:text-ink grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-[18px] w-[18px]", refreshing && "animate-spin")} />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <EmailList
          emails={emails}
          loading={!loaded}
          selectedId={null}
          onSelect={onSelect}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      </div>
    </div>
  );
}
