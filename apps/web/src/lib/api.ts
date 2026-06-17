import type {
  CalendarEventDetailResponse,
  CalendarEventInput,
  CalendarEventListResponse,
  CalendarEventMutationResponse,
  CalendarEventSearchResponse,
  CalendarSyncResponse,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  DraftSendResponse,
  EmailDetailResponse,
  EmailListResponse,
  EmailSearchResponse,
  EmailSendInput,
  EmailSendResponse,
  EmailSyncResponse,
  IntegrationStatusResponse,
  SubscriptionResponse,
  UpgradeRequest,
  VerifyPaymentRequest,
} from "@repo/shared";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Thrown when a usage endpoint returns 402 (the plan's cap was reached). */
export class PlanLimitError extends Error {
  constructor(public readonly metric: string) {
    super(`Plan limit reached: ${metric}`);
    this.name = "PlanLimitError";
  }
}

export async function getSubscription(): Promise<SubscriptionResponse> {
  const res = await fetch(`${API_URL}/api/account/subscription`, { credentials: "include" });
  if (!res.ok) throw new Error(`Subscription fetch failed with status ${res.status}`);
  return (await res.json()) as SubscriptionResponse;
}

export async function upgradeSubscription(input: UpgradeRequest): Promise<SubscriptionResponse> {
  const res = await fetch(`${API_URL}/api/account/upgrade`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Upgrade failed with status ${res.status}`);
  return (await res.json()) as SubscriptionResponse;
}

export async function downgradeSubscription(): Promise<SubscriptionResponse> {
  const res = await fetch(`${API_URL}/api/account/downgrade`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Downgrade failed with status ${res.status}`);
  return (await res.json()) as SubscriptionResponse;
}

async function consumeUsage(path: string, body?: unknown): Promise<SubscriptionResponse> {
  const res = await fetch(`${API_URL}/api/account/usage/${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (res.status === 402) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new PlanLimitError(data?.error?.replace("limit:", "") ?? "chats");
  }
  if (!res.ok) throw new Error(`Usage update failed with status ${res.status}`);
  return (await res.json()) as SubscriptionResponse;
}

export function consumeChatUsage(newConversation: boolean): Promise<SubscriptionResponse> {
  return consumeUsage("chat", { newConversation });
}

export function consumeEmailSyncUsage(): Promise<SubscriptionResponse> {
  return consumeUsage("email-sync");
}

export async function createPaymentOrder(
  plan: CreateOrderRequest["plan"],
): Promise<CreateOrderResponse> {
  const res = await fetch(`${API_URL}/api/payment/create-order`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan } satisfies CreateOrderRequest),
  });
  if (!res.ok) throw new Error(`Failed to create payment order: ${res.status}`);
  return (await res.json()) as CreateOrderResponse;
}

export async function verifyPayment(input: VerifyPaymentRequest): Promise<SubscriptionResponse> {
  const res = await fetch(`${API_URL}/api/payment/verify`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Payment verification failed: ${res.status}`);
  return (await res.json()) as SubscriptionResponse;
}

export async function getIntegrationStatus(): Promise<IntegrationStatusResponse> {
  const res = await fetch(`${API_URL}/api/integrations/google/status`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Integration status failed with status ${res.status}`);
  }

  return (await res.json()) as IntegrationStatusResponse;
}

/** Deep-link that kicks off the Corsair OAuth flow for a Google plugin. */
export function connectUrl(plugin: "gmail" | "googlecalendar"): string {
  return `${API_URL}/api/integrations/google/connect/${plugin}`;
}

export async function disconnectIntegration(
  plugin: "gmail" | "googlecalendar",
): Promise<IntegrationStatusResponse> {
  const res = await fetch(`${API_URL}/api/integrations/google/${plugin}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Disconnecting integration failed with status ${res.status}`);
  }

  return (await res.json()) as IntegrationStatusResponse;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  conversationId?: number,
): Promise<ChatResponse> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, timeZone, conversationId } satisfies ChatRequest),
  });

  if (!res.ok) {
    throw new Error(`Chat request failed with status ${res.status}`);
  }

  return (await res.json()) as ChatResponse;
}

export async function syncEmails(maxResults?: number): Promise<EmailSyncResponse> {
  const res = await fetch(`${API_URL}/api/emails/sync`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(maxResults === undefined ? {} : { maxResults }),
  });

  if (!res.ok) {
    throw new Error(`Email sync failed with status ${res.status}`);
  }

  return (await res.json()) as EmailSyncResponse;
}

export async function listEmails(
  params: { limit?: number; offset?: number } = {},
): Promise<EmailListResponse> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));

  const res = await fetch(`${API_URL}/api/emails?${query.toString()}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Listing emails failed with status ${res.status}`);
  }

  return (await res.json()) as EmailListResponse;
}

/**
 * Subscribes to the inbox's Server-Sent Events stream and invokes `onUpdate`
 * whenever the backend syncs new emails (manual sync or the Gmail webhook).
 * Returns an unsubscribe function.
 */
export function subscribeToEmailUpdates(onUpdate: () => void): () => void {
  const source = new EventSource(`${API_URL}/api/emails/stream`, { withCredentials: true });
  source.onmessage = () => onUpdate();
  return () => source.close();
}

export async function searchEmails(query: string, limit?: number): Promise<EmailSearchResponse> {
  const params = new URLSearchParams({ q: query });
  if (limit !== undefined) params.set("limit", String(limit));

  const res = await fetch(`${API_URL}/api/emails/search?${params.toString()}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Email search failed with status ${res.status}`);
  }

  return (await res.json()) as EmailSearchResponse;
}

export async function getEmail(id: string): Promise<EmailDetailResponse> {
  const res = await fetch(`${API_URL}/api/emails/${encodeURIComponent(id)}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Loading email failed with status ${res.status}`);
  }

  return (await res.json()) as EmailDetailResponse;
}

export async function listSentEmails(
  params: { limit?: number; offset?: number } = {},
): Promise<EmailListResponse> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));

  const res = await fetch(`${API_URL}/api/emails/sent?${query.toString()}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Listing sent emails failed with status ${res.status}`);
  }

  return (await res.json()) as EmailListResponse;
}

export async function listArchivedEmails(
  params: { limit?: number; offset?: number } = {},
): Promise<EmailListResponse> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));

  const res = await fetch(`${API_URL}/api/emails/archived?${query.toString()}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Listing archived emails failed with status ${res.status}`);
  }

  return (await res.json()) as EmailListResponse;
}

export async function archiveEmail(id: string): Promise<EmailDetailResponse> {
  const res = await fetch(`${API_URL}/api/emails/${encodeURIComponent(id)}/archive`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Archiving email failed with status ${res.status}`);
  }

  return (await res.json()) as EmailDetailResponse;
}

export async function sendEmail(input: EmailSendInput): Promise<EmailSendResponse> {
  const res = await fetch(`${API_URL}/api/emails/send`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(`Sending email failed with status ${res.status}`);
  }

  return (await res.json()) as EmailSendResponse;
}

export async function listDrafts(
  params: { limit?: number; offset?: number } = {},
): Promise<EmailListResponse> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));

  const res = await fetch(`${API_URL}/api/emails/drafts?${query.toString()}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Listing drafts failed with status ${res.status}`);
  }

  return (await res.json()) as EmailListResponse;
}

export async function sendDraft(draftId: string): Promise<DraftSendResponse> {
  const res = await fetch(`${API_URL}/api/emails/drafts/${encodeURIComponent(draftId)}/send`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Sending draft failed with status ${res.status}`);
  }

  return (await res.json()) as DraftSendResponse;
}

export async function deleteDraft(draftId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/emails/drafts/${encodeURIComponent(draftId)}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Deleting draft failed with status ${res.status}`);
  }
}

export async function syncCalendar(maxResults?: number): Promise<CalendarSyncResponse> {
  const res = await fetch(`${API_URL}/api/calendar/sync`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(maxResults === undefined ? {} : { maxResults }),
  });

  if (!res.ok) {
    throw new Error(`Calendar sync failed with status ${res.status}`);
  }

  return (await res.json()) as CalendarSyncResponse;
}

export async function listCalendarEvents(
  params: { limit?: number; offset?: number } = {},
): Promise<CalendarEventListResponse> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));

  const res = await fetch(`${API_URL}/api/calendar?${query.toString()}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Listing calendar events failed with status ${res.status}`);
  }

  return (await res.json()) as CalendarEventListResponse;
}

/**
 * Subscribes to the calendar's Server-Sent Events stream and invokes
 * `onUpdate` whenever the backend syncs new/changed events (manual sync or
 * the Google Calendar push notification webhook). Returns an unsubscribe
 * function.
 */
export function subscribeToCalendarUpdates(onUpdate: () => void): () => void {
  const source = new EventSource(`${API_URL}/api/calendar/stream`, { withCredentials: true });
  source.onmessage = () => onUpdate();
  return () => source.close();
}

export async function searchCalendarEvents(
  query: string,
  limit?: number,
): Promise<CalendarEventSearchResponse> {
  const params = new URLSearchParams({ q: query });
  if (limit !== undefined) params.set("limit", String(limit));

  const res = await fetch(`${API_URL}/api/calendar/search?${params.toString()}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Calendar search failed with status ${res.status}`);
  }

  return (await res.json()) as CalendarEventSearchResponse;
}

export async function getCalendarEvent(id: string): Promise<CalendarEventDetailResponse> {
  const res = await fetch(`${API_URL}/api/calendar/${encodeURIComponent(id)}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Loading calendar event failed with status ${res.status}`);
  }

  return (await res.json()) as CalendarEventDetailResponse;
}

export async function createCalendarEvent(
  input: CalendarEventInput,
): Promise<CalendarEventMutationResponse> {
  const res = await fetch(`${API_URL}/api/calendar`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(`Creating calendar event failed with status ${res.status}`);
  }

  return (await res.json()) as CalendarEventMutationResponse;
}

export async function updateCalendarEvent(
  id: string,
  input: CalendarEventInput,
): Promise<CalendarEventMutationResponse> {
  const res = await fetch(`${API_URL}/api/calendar/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(`Updating calendar event failed with status ${res.status}`);
  }

  return (await res.json()) as CalendarEventMutationResponse;
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/calendar/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Deleting calendar event failed with status ${res.status}`);
  }
}
