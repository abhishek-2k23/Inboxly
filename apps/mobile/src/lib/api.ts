import Constants from "expo-constants";
import type {
  CalendarEventDetailResponse,
  CalendarEventInput,
  CalendarEventListResponse,
  CalendarEventMutationResponse,
  CalendarSyncResponse,
  ChatMessage,
  ChatResponse,
  EmailDetailResponse,
  EmailListResponse,
  EmailSearchResponse,
  EmailSendInput,
  EmailSendResponse,
  EmailSyncResponse,
  GoogleIntegrationPlugin,
  IntegrationStatusResponse,
  SubscriptionResponse,
} from "@/types";

export const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:4000";

/** Web dashboard URL — used to hand off the cookie-based Google OAuth connect flow. */
export const WEB_URL =
  (Constants.expoConfig?.extra?.webUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_WEB_URL ??
  "http://localhost:3000";

/**
 * Token getter registered at app root from Clerk's `getToken()`. The frontend
 * and API live on different domains, so cookies are not sent — the Clerk
 * session JWT must travel in the Authorization header instead (mirrors
 * apps/web/src/lib/api.ts `apiFetch`).
 */
type TokenGetter = () => Promise<string | null | undefined>;
let getAuthToken: TokenGetter = async () => null;

export function registerTokenGetter(fn: TokenGetter): void {
  getAuthToken = fn;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAuthToken().catch(() => null);
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} → ${res.status}`);
  // DELETE endpoints may return an empty body.
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ── Email ────────────────────────────────────────────────────────
export const listEmails = (params: { limit?: number; offset?: number } = {}) =>
  request<EmailListResponse>(`/api/emails?${qs(params)}`);

export const listSentEmails = (params: { limit?: number; offset?: number } = {}) =>
  request<EmailListResponse>(`/api/emails/sent?${qs(params)}`);

export const listArchivedEmails = (params: { limit?: number; offset?: number } = {}) =>
  request<EmailListResponse>(`/api/emails/archived?${qs(params)}`);

export const listDrafts = (params: { limit?: number; offset?: number } = {}) =>
  request<EmailListResponse>(`/api/emails/drafts?${qs(params)}`);

export const getEmail = (id: string) =>
  request<EmailDetailResponse>(`/api/emails/${encodeURIComponent(id)}`);

export const searchEmails = (query: string, limit?: number) => {
  const q = new URLSearchParams({ q: query });
  if (limit !== undefined) q.set("limit", String(limit));
  return request<EmailSearchResponse>(`/api/emails/search?${q}`);
};

export const archiveEmail = (id: string) =>
  request<EmailDetailResponse>(`/api/emails/${encodeURIComponent(id)}/archive`, {
    method: "POST",
  });

export const sendEmail = (input: EmailSendInput) =>
  request<EmailSendResponse>("/api/emails/send", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const syncEmails = (maxResults?: number) =>
  request<EmailSyncResponse>("/api/emails/sync", {
    method: "POST",
    body: JSON.stringify(maxResults !== undefined ? { maxResults } : {}),
  });

// ── Calendar ─────────────────────────────────────────────────────
export const listCalendarEvents = (params: { limit?: number; offset?: number } = {}) =>
  request<CalendarEventListResponse>(`/api/calendar?${qs(params)}`);

export const getCalendarEvent = (id: string) =>
  request<CalendarEventDetailResponse>(`/api/calendar/${encodeURIComponent(id)}`);

export const createCalendarEvent = (input: CalendarEventInput) =>
  request<CalendarEventMutationResponse>("/api/calendar", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateCalendarEvent = (id: string, input: CalendarEventInput) =>
  request<CalendarEventMutationResponse>(`/api/calendar/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

export const deleteCalendarEvent = (id: string) =>
  request<void>(`/api/calendar/${encodeURIComponent(id)}`, { method: "DELETE" });

export const syncCalendar = (maxResults?: number) =>
  request<CalendarSyncResponse>("/api/calendar/sync", {
    method: "POST",
    body: JSON.stringify(maxResults !== undefined ? { maxResults } : {}),
  });

// ── Chat ─────────────────────────────────────────────────────────
export const sendChatMessage = (messages: ChatMessage[], conversationId?: number) =>
  request<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      messages,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      conversationId,
    }),
  });

// ── Integrations ─────────────────────────────────────────────────
export const getIntegrationStatus = () =>
  request<IntegrationStatusResponse>("/api/integrations/google/status");

export const disconnectIntegration = (plugin: GoogleIntegrationPlugin) =>
  request<IntegrationStatusResponse>(`/api/integrations/google/${plugin}`, {
    method: "DELETE",
  });

/** Deep-link that kicks off the Corsair OAuth flow for a Google plugin. */
export const connectUrl = (plugin: GoogleIntegrationPlugin) =>
  `${API_URL}/api/integrations/google/connect/${plugin}`;

// ── Account / billing ────────────────────────────────────────────
export const getSubscription = () => request<SubscriptionResponse>("/api/account/subscription");

export const deleteAccount = () => request<void>("/api/account", { method: "DELETE" });

function qs(params: { limit?: number; offset?: number }): string {
  const q = new URLSearchParams();
  if (params.limit !== undefined) q.set("limit", String(params.limit));
  if (params.offset !== undefined) q.set("offset", String(params.offset));
  return q.toString();
}
