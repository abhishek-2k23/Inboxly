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
  EmailListResponse,
  EmailSearchResponse,
  EmailSyncResponse,
  IntegrationStatusResponse,
} from "@repo/shared";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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
