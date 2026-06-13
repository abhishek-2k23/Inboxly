export interface GmailMessagePart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: { name?: string; value?: string }[];
  body?: { attachmentId?: string; size?: number; data?: string };
  parts?: GmailMessagePart[];
}

export interface ParsedEmailContent {
  subject?: string;
  from?: string;
  to?: string;
  body?: string;
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data, "base64url").toString("utf-8");
}

function findHeader(headers: GmailMessagePart["headers"], name: string): string | undefined {
  return headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value;
}

function findPartByMimeType(part: GmailMessagePart | undefined, mimeType: string): GmailMessagePart | undefined {
  if (!part) return undefined;
  if (part.mimeType === mimeType && part.body?.data) return part;
  for (const child of part.parts ?? []) {
    const found = findPartByMimeType(child, mimeType);
    if (found) return found;
  }
  return undefined;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function extractEmailBody(payload?: GmailMessagePart): string | undefined {
  const plainTextPart = findPartByMimeType(payload, "text/plain");
  if (plainTextPart?.body?.data) return decodeBase64Url(plainTextPart.body.data);

  const htmlPart = findPartByMimeType(payload, "text/html");
  if (htmlPart?.body?.data) return stripHtml(decodeBase64Url(htmlPart.body.data));

  if (payload?.body?.data) return decodeBase64Url(payload.body.data);

  return undefined;
}

export function parseEmailContent(payload?: GmailMessagePart): ParsedEmailContent {
  return {
    subject: findHeader(payload?.headers, "Subject"),
    from: findHeader(payload?.headers, "From"),
    to: findHeader(payload?.headers, "To"),
    body: extractEmailBody(payload),
  };
}
