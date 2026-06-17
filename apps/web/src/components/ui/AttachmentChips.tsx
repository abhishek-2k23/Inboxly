"use client";

import type { EmailAttachment } from "@repo/shared";
import { FileImage, FileText, X } from "lucide-react";
import { formatBytes } from "@/lib/attachments";
import { cn } from "@/lib/ui";

/** Removable file chips shown above the Compose toolbar and inside the AI prompt box. */
export function AttachmentChips({
  attachments,
  onRemove,
  className,
}: {
  attachments: EmailAttachment[];
  onRemove: (index: number) => void;
  className?: string;
}) {
  if (attachments.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {attachments.map((att, i) => {
        const Icon = att.mimeType.startsWith("image/") ? FileImage : FileText;
        return (
          <span
            key={`${att.filename}-${i}`}
            className="bg-surface border-line text-ink flex items-center gap-2 rounded-lg border py-1.5 pl-2.5 pr-1.5 text-xs"
          >
            <Icon className="text-ink-3 h-3.5 w-3.5 shrink-0" />
            <span className="max-w-[12rem] truncate">{att.filename}</span>
            <span className="text-ink-3 shrink-0">{formatBytes(att.size)}</span>
            <button
              type="button"
              aria-label={`Remove ${att.filename}`}
              onClick={() => onRemove(i)}
              className="text-ink-3 hover:text-ink grid h-4 w-4 shrink-0 place-items-center rounded-full transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        );
      })}
    </div>
  );
}
