"use client";

import { useState } from "react";
import type { EmailSummary } from "@repo/shared";
import { useEmailStore } from "@/stores/email-store";
import { ComposeModal, type ComposeDraft } from "./ComposeModal";
import { MailFolderView } from "./MailFolderView";

export function DraftsView() {
  const draftEmails = useEmailStore((s) => s.draftEmails);
  const draftsLoaded = useEmailStore((s) => s.draftsLoaded);
  const loadDrafts = useEmailStore((s) => s.loadDrafts);

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeDraft, setComposeDraft] = useState<ComposeDraft | undefined>(undefined);

  // Opening a draft reopens it in the composer (keyed by draftId) rather than
  // navigating to a read-only detail view.
  function handleSelect(email: EmailSummary) {
    if (email.draftId) {
      setComposeDraft({
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        subject: email.subject,
        body: email.body,
        draftId: email.draftId,
      });
      setComposeOpen(true);
    }
  }

  return (
    <>
      <MailFolderView
        title="Drafts"
        emails={draftEmails}
        loaded={draftsLoaded}
        load={loadDrafts}
        onSelect={handleSelect}
        emptyTitle="No drafts"
        emptyDescription="Messages you start writing and close before sending will show up here."
      />
      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} draft={composeDraft} />
    </>
  );
}
