export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  message: ChatMessage;
}

export interface ApiError {
  error: string;
}

export interface HealthResponse {
  status: "ok";
  uptime: number;
}

export interface MeResponse {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

export interface ItemResponse {
  id: number;
  name: string;
  createdAt: string;
}

export type GoogleIntegrationPlugin = "gmail" | "googlecalendar";

export type IntegrationConnectionState = "connected" | "missing_credentials" | "not_connected";

export type IntegrationStatusResponse = Record<GoogleIntegrationPlugin, IntegrationConnectionState>;

export interface EmailSummary {
  id: string;
  threadId?: string;
  subject?: string;
  from?: string;
  to?: string;
  snippet?: string;
  body?: string;
  labelIds?: string[];
  internalDate?: string | null;
}

export interface EmailListResponse {
  emails: EmailSummary[];
}

export interface EmailSyncResponse {
  synced: number;
  embedded: number;
}

export interface EmailSearchResult extends EmailSummary {
  similarity: number;
}

export interface EmailSearchResponse {
  results: EmailSearchResult[];
}
