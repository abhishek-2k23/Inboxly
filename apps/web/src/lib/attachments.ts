import type { EmailAttachment, SubscriptionType } from "@repo/shared";

/** Per-plan single-file size cap. Mirrors the server (account.service MAX_ATTACHMENT_BYTES). */
export const MAX_ATTACHMENT_BYTES: Record<SubscriptionType, number> = {
  free: 5 * 1024 * 1024,
  pro: 10 * 1024 * 1024,
};

export const MAX_ATTACHMENTS_PER_EMAIL = 5;

/** The single-file cap for a plan (defaults to the free cap when unknown). */
export function maxBytesForPlan(plan: SubscriptionType | undefined): number {
  return MAX_ATTACHMENT_BYTES[plan ?? "free"];
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}

/**
 * Reads a File into an `EmailAttachment` with standard base64 content (the
 * `data:<mime>;base64,` prefix from readAsDataURL is stripped).
 */
export function fileToAttachment(file: File): Promise<EmailAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const comma = result.indexOf(",");
      resolve({
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        data: comma >= 0 ? result.slice(comma + 1) : result,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  });
}
