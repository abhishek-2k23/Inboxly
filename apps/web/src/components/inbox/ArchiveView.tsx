"use client";

import { useRouter } from "next/navigation";
import type { EmailSummary } from "@repo/shared";
import { useEmailStore } from "@/stores/email-store";
import { MailFolderView } from "./MailFolderView";

export function ArchiveView() {
  const router = useRouter();
  const archivedEmails = useEmailStore((s) => s.archivedEmails);
  const archivedLoaded = useEmailStore((s) => s.archivedLoaded);
  const loadArchived = useEmailStore((s) => s.loadArchived);

  function handleSelect(email: EmailSummary) {
    router.push(`/dashboard/inbox/${email.id}`);
  }

  return (
    <MailFolderView
      title="Archive"
      emails={archivedEmails}
      loaded={archivedLoaded}
      load={loadArchived}
      onSelect={handleSelect}
      emptyTitle="Nothing archived"
      emptyDescription="Emails you archive from your inbox will be kept here."
    />
  );
}
