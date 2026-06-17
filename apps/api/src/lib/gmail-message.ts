export interface GmailMessagePart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: { name?: string; value?: string }[];
  body?: { attachmentId?: string; size?: number; data?: string };
  parts?: GmailMessagePart[];
}

export interface ParsedAttachment {
  attachmentId?: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface ParsedEmailContent {
  subject?: string;
  from?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  body?: string;
  /** Raw HTML part, when Gmail provided one - the caller is responsible for sanitizing before rendering. */
  html?: string;
  /** Files attached to the message (metadata only - no bytes). */
  attachments?: ParsedAttachment[];
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data, "base64url").toString("utf-8");
}

export function findHeader(headers: GmailMessagePart["headers"], name: string): string | undefined {
  return headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value;
}

function findPartByMimeType(
  part: GmailMessagePart | undefined,
  mimeType: string,
): GmailMessagePart | undefined {
  if (!part) return undefined;
  if (part.mimeType === mimeType && part.body?.data) return part;
  for (const child of part.parts ?? []) {
    const found = findPartByMimeType(child, mimeType);
    if (found) return found;
  }
  return undefined;
}

const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

function stripHtml(html: string): string {
  return (
    html
      // <style>/<script> blocks carry no readable content - drop the tag *and*
      // its body, not just the tag (a plain tag-strip leaves raw CSS/JS text).
      .replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&(nbsp|amp|lt|gt|quot|#39|apos);/g, (m) => HTML_ENTITIES[m] ?? m)
      .replace(/\s+/g, " ")
      .trim()
  );
}

function findHtmlPart(payload?: GmailMessagePart): string | undefined {
  const htmlPart = findPartByMimeType(payload, "text/html");
  return htmlPart?.body?.data ? decodeBase64Url(htmlPart.body.data) : undefined;
}

export function extractEmailBody(payload?: GmailMessagePart): string | undefined {
  const plainTextPart = findPartByMimeType(payload, "text/plain");
  if (plainTextPart?.body?.data) return decodeBase64Url(plainTextPart.body.data);

  const html = findHtmlPart(payload);
  if (html) return stripHtml(html);

  if (payload?.body?.data) return decodeBase64Url(payload.body.data);

  return undefined;
}

/**
 * Collects attachment parts (anything with a non-empty `filename`) anywhere in
 * the MIME tree. Metadata only - the bytes live behind `body.attachmentId`,
 * which the Gmail plugin doesn't expose a fetch for, so we don't include data.
 */
export function extractAttachments(payload?: GmailMessagePart): ParsedAttachment[] {
  const out: ParsedAttachment[] = [];
  const walk = (part?: GmailMessagePart) => {
    if (!part) return;
    if (part.filename && part.filename.trim()) {
      out.push({
        attachmentId: part.body?.attachmentId,
        filename: part.filename,
        mimeType: part.mimeType ?? "application/octet-stream",
        size: part.body?.size ?? 0,
      });
    }
    for (const child of part.parts ?? []) walk(child);
  };
  walk(payload);
  return out;
}

export function parseEmailContent(payload?: GmailMessagePart): ParsedEmailContent {
  const attachments = extractAttachments(payload);
  return {
    subject: findHeader(payload?.headers, "Subject"),
    from: findHeader(payload?.headers, "From"),
    to: findHeader(payload?.headers, "To"),
    cc: findHeader(payload?.headers, "Cc"),
    bcc: findHeader(payload?.headers, "Bcc"),
    body: extractEmailBody(payload),
    html: findHtmlPart(payload),
    attachments: attachments.length > 0 ? attachments : undefined,
  };
}
