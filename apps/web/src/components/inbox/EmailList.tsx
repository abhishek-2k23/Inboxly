"use client";

import { Inbox } from "lucide-react";
import type { EmailSummary } from "@repo/shared";
import { EmailRow } from "./EmailRow";

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 px-5 py-3">
      <div className="bg-surface-hover h-9 w-9 shrink-0 animate-pulse rounded-full" />
      <div className="min-w-0 flex-1 space-y-2 py-1">
        <div className="bg-surface-hover h-3 w-1/3 animate-pulse rounded" />
        <div className="bg-surface-hover h-3 w-2/3 animate-pulse rounded" />
      </div>
    </div>
  );
}

/** The scrollable email list with loading skeletons and a themed empty state. */
export function EmailList({
  emails,
  loading,
  selectedId,
  onSelect,
  emptyTitle,
  emptyDescription,
}: {
  emails: EmailSummary[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (email: EmailSummary) => void;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (loading) {
    return (
      <div className="flex flex-col">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-20 text-center">
        <span className="border-line bg-surface text-ink-3 grid h-12 w-12 place-items-center rounded-xl border">
          <Inbox className="h-5 w-5" />
        </span>
        <h2 className="text-ink mt-4 text-base font-semibold tracking-tight">{emptyTitle}</h2>
        <p className="text-ink-3 mt-1.5 max-w-xs text-sm leading-relaxed">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="divide-line flex flex-col divide-y">
      {emails.map((email) => (
        <EmailRow
          key={email.id}
          email={email}
          active={email.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
