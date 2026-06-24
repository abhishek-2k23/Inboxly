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
  EmailAttachment,
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

/**
 * Drop-in replacement for `fetch` that attaches the Clerk session JWT as a
 * Bearer token. This is required in production where the frontend and API are
 * on different domains — cookies are not sent cross-origin, so the token must
 * travel in the Authorization header instead.
 */
async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  // window.Clerk is injected by @clerk/nextjs after ClerkProvider mounts.
  const token: string | null | undefined = await (
    window as { Clerk?: { session?: { getToken?: () => Promise<string> } } }
  ).Clerk?.session?.getToken?.();
  return fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export async function getSubscription(): Promise<SubscriptionResponse> {
  const res = await apiFetch(`${API_URL}/api/account/subscription`);
  if (!res.ok) throw new Error(`Subscription fetch failed with status ${res.status}`);
  return (await res.json()) as SubscriptionResponse;
}

export async function upgradeSubscription(input: UpgradeRequest): Promise<SubscriptionResponse> {
  const res = await apiFetch(`${API_URL}/api/account/upgrade`, {
    method: "POST",

    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Upgrade failed with status ${res.status}`);
  return (await res.json()) as SubscriptionResponse;
}

export async function downgradeSubscription(): Promise<SubscriptionResponse> {
  const res = await apiFetch(`${API_URL}/api/account/downgrade`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Downgrade failed with status ${res.status}`);
  return (await res.json()) as SubscriptionResponse;
}

async function consumeUsage(path: string, body?: unknown): Promise<SubscriptionResponse> {
  const res = await apiFetch(`${API_URL}/api/account/usage/${path}`, {
    method: "POST",

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
  const res = await apiFetch(`${API_URL}/api/payment/create-order`, {
    method: "POST",

    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan } satisfies CreateOrderRequest),
  });
  if (!res.ok) throw new Error(`Failed to create payment order: ${res.status}`);
  return (await res.json()) as CreateOrderResponse;
}

export async function verifyPayment(input: VerifyPaymentRequest): Promise<SubscriptionResponse> {
  const res = await apiFetch(`${API_URL}/api/payment/verify`, {
    method: "POST",

    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Payment verification failed: ${res.status}`);
  return (await res.json()) as SubscriptionResponse;
}

export async function getIntegrationStatus(): Promise<IntegrationStatusResponse> {
  const res = await apiFetch(`${API_URL}/api/integrations/google/status`);

  if (!res.ok) {
    throw new Error(`Integration status failed with status ${res.status}`);
  }

  return (await res.json()) as IntegrationStatusResponse;
}

/**
 * Kicks off the Corsair OAuth flow for a Google plugin and returns the Google
 * consent URL to open. This must be an authenticated request (Bearer token) —
 * in production the API is cross-domain, so the connect endpoint can't be
 * reached by a bare popup navigation (no cookie, no auth header → 401).
 */
export async function getConnectUrl(plugin: "gmail" | "googlecalendar"): Promise<string> {
  const res = await apiFetch(`${API_URL}/api/integrations/google/connect/${plugin}`);
  if (!res.ok) {
    throw new Error(`Starting connect flow failed with status ${res.status}`);
  }
  const { url } = (await res.json()) as { url: string };
  return url;
}

export async function disconnectIntegration(
  plugin: "gmail" | "googlecalendar",
): Promise<IntegrationStatusResponse> {
  const res = await apiFetch(`${API_URL}/api/integrations/google/${plugin}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(`Disconnecting integration failed with status ${res.status}`);
  }

  return (await res.json()) as IntegrationStatusResponse;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  conversationId?: number,
  attachments?: EmailAttachment[],
): Promise<ChatResponse> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const res = await apiFetch(`${API_URL}/api/chat`, {
    method: "POST",

    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, timeZone, conversationId, attachments } satisfies ChatRequest),
  });

  if (res.status === 402) {
    // The chat hit a plan cap (e.g. its per-chat message limit, "chatDepth").
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new PlanLimitError(data?.error?.replace("limit:", "") ?? "chatDepth");
  }
  if (!res.ok) {
    throw new Error(`Chat request failed with status ${res.status}`);
  }

  return (await res.json()) as ChatResponse;
}

export async function listConversations(): Promise<{
  conversations: Array<{
    id: number;
    title: string | null;
    updatedAt: string;
    messages: Array<{ role: string; content: string }>;
  }>;
}> {
  const res = await apiFetch(`${API_URL}/api/chat/conversations`);
  if (!res.ok) throw new Error(`Listing conversations failed with status ${res.status}`);
  return (await res.json()) as {
    conversations: Array<{
      id: number;
      title: string | null;
      updatedAt: string;
      messages: Array<{ role: string; content: string }>;
    }>;
  };
}

export async function syncEmails(maxResults?: number): Promise<EmailSyncResponse> {
  const res = await apiFetch(`${API_URL}/api/emails/sync`, {
    method: "POST",

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

  const res = await apiFetch(`${API_URL}/api/emails?${query.toString()}`);

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

  const res = await apiFetch(`${API_URL}/api/emails/search?${params.toString()}`);

  if (!res.ok) {
    throw new Error(`Email search failed with status ${res.status}`);
  }

  return (await res.json()) as EmailSearchResponse;
}

export async function getEmail(id: string): Promise<EmailDetailResponse> {
  const res = await apiFetch(`${API_URL}/api/emails/${encodeURIComponent(id)}`);

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

  const res = await apiFetch(`${API_URL}/api/emails/sent?${query.toString()}`);

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

  const res = await apiFetch(`${API_URL}/api/emails/archived?${query.toString()}`);

  if (!res.ok) {
    throw new Error(`Listing archived emails failed with status ${res.status}`);
  }

  return (await res.json()) as EmailListResponse;
}

export async function archiveEmail(id: string): Promise<EmailDetailResponse> {
  const res = await apiFetch(`${API_URL}/api/emails/${encodeURIComponent(id)}/archive`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(`Archiving email failed with status ${res.status}`);
  }

  return (await res.json()) as EmailDetailResponse;
}

export async function sendEmail(input: EmailSendInput): Promise<EmailSendResponse> {
  const res = await apiFetch(`${API_URL}/api/emails/send`, {
    method: "POST",

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

  const res = await apiFetch(`${API_URL}/api/emails/drafts?${query.toString()}`);

  if (!res.ok) {
    throw new Error(`Listing drafts failed with status ${res.status}`);
  }

  return (await res.json()) as EmailListResponse;
}

export async function sendDraft(draftId: string): Promise<DraftSendResponse> {
  const res = await apiFetch(`${API_URL}/api/emails/drafts/${encodeURIComponent(draftId)}/send`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(`Sending draft failed with status ${res.status}`);
  }

  return (await res.json()) as DraftSendResponse;
}

export async function deleteDraft(draftId: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/api/emails/drafts/${encodeURIComponent(draftId)}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(`Deleting draft failed with status ${res.status}`);
  }
}

export async function syncCalendar(maxResults?: number): Promise<CalendarSyncResponse> {
  const res = await apiFetch(`${API_URL}/api/calendar/sync`, {
    method: "POST",

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

  const res = await apiFetch(`${API_URL}/api/calendar?${query.toString()}`);

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

  const res = await apiFetch(`${API_URL}/api/calendar/search?${params.toString()}`);

  if (!res.ok) {
    throw new Error(`Calendar search failed with status ${res.status}`);
  }

  return (await res.json()) as CalendarEventSearchResponse;
}

export async function getCalendarEvent(id: string): Promise<CalendarEventDetailResponse> {
  const res = await apiFetch(`${API_URL}/api/calendar/${encodeURIComponent(id)}`);

  if (!res.ok) {
    throw new Error(`Loading calendar event failed with status ${res.status}`);
  }

  return (await res.json()) as CalendarEventDetailResponse;
}

export async function createCalendarEvent(
  input: CalendarEventInput,
): Promise<CalendarEventMutationResponse> {
  const res = await apiFetch(`${API_URL}/api/calendar`, {
    method: "POST",

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
  const res = await apiFetch(`${API_URL}/api/calendar/${encodeURIComponent(id)}`, {
    method: "PATCH",

    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(`Updating calendar event failed with status ${res.status}`);
  }

  return (await res.json()) as CalendarEventMutationResponse;
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/api/calendar/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(`Deleting calendar event failed with status ${res.status}`);
  }
}

export async function deleteAccount(): Promise<void> {
  const res = await apiFetch(`${API_URL}/api/account`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Account deletion failed with status ${res.status}`);
}
