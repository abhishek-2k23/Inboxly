import Constants from "expo-constants";
import type {
  CalendarEventListResponse,
  CalendarEventSummary,
  ChatMessage,
  ChatResponse,
  EmailListResponse,
  EmailSyncResponse,
  IntegrationStatusResponse,
} from "@/types";

export const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Email ────────────────────────────────────────────────────────
export const listEmails = (params: { limit?: number; offset?: number } = {}) => {
  const q = new URLSearchParams();
  if (params.limit !== undefined) q.set("limit", String(params.limit));
  if (params.offset !== undefined) q.set("offset", String(params.offset));
  return request<EmailListResponse>(`/api/emails?${q}`);
};

export const syncEmails = (maxResults?: number) =>
  request<EmailSyncResponse>("/api/emails/sync", {
    method: "POST",
    body: JSON.stringify(maxResults !== undefined ? { maxResults } : {}),
  });

// ── Calendar ─────────────────────────────────────────────────────
export const listCalendarEvents = (params: { limit?: number } = {}) => {
  const q = new URLSearchParams();
  if (params.limit !== undefined) q.set("limit", String(params.limit));
  return request<CalendarEventListResponse>(`/api/calendar?${q}`);
};

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
