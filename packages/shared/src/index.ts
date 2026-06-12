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
