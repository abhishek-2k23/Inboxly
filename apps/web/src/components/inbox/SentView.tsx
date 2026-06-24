"use client";

import { useRouter } from "next/navigation";
import type { EmailSummary } from "@repo/shared";
import { useEmailStore } from "@/stores/email-store";
import { MailFolderView } from "./MailFolderView";

export function SentView() {
  const router = useRouter();
  const sentEmails = useEmailStore((s) => s.sentEmails);
  const sentLoaded = useEmailStore((s) => s.sentLoaded);
  const loadSent = useEmailStore((s) => s.loadSent);

  function handleSelect(email: EmailSummary) {
    router.push(`/dashboard/inbox/${email.id}?from=sent`);
  }

  return (
    <MailFolderView
      title="Sent"
      emails={sentEmails}
      loaded={sentLoaded}
      load={loadSent}
      onSelect={handleSelect}
      emptyTitle="No sent mail"
      emptyDescription="Messages you send will show up here."
    />
  );
}
