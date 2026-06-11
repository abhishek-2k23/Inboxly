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
