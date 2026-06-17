"use client";

import type { EmailAttachment } from "@repo/shared";
import { useCallback, useState } from "react";
import { useToast } from "@/components/toast";
import {
  fileToAttachment,
  formatBytes,
  MAX_ATTACHMENTS_PER_EMAIL,
  maxBytesForPlan,
} from "@/lib/attachments";
import { useSubscriptionStore } from "@/stores/subscription-store";

/**
 * Shared attachment state for Compose and the AI prompt box: converts picked
 * files to `EmailAttachment`s and enforces the per-plan single-file cap and the
 * max-file-count client-side (the server re-checks both).
 */
export function useAttachments() {
  const toast = useToast();
  const plan = useSubscriptionStore((s) => s.data?.subscriptionType);
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const max = maxBytesForPlan(plan);
      const accepted: EmailAttachment[] = [];

      for (const file of Array.from(files)) {
        if (file.size > max) {
          toast.error(
            `"${file.name}" is ${formatBytes(file.size)}. Your plan allows files up to ${formatBytes(max)}.`,
          );
          continue;
        }
        accepted.push(await fileToAttachment(file));
      }
      if (accepted.length === 0) return;

      setAttachments((prev) => {
        const room = MAX_ATTACHMENTS_PER_EMAIL - prev.length;
        if (room <= 0 || accepted.length > room) {
          toast.error(`You can attach up to ${MAX_ATTACHMENTS_PER_EMAIL} files.`);
        }
        return room <= 0 ? prev : [...prev, ...accepted.slice(0, room)];
      });
    },
    [plan, toast],
  );

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clear = useCallback(() => setAttachments([]), []);

  return { attachments, addFiles, removeAttachment, clear };
}
