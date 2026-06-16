// Local mirror of @repo/shared types — avoids ESM/Metro conflicts.

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  timeZone?: string;
  conversationId?: number;
}

export interface ChatResponse {
  message: ChatMessage;
  calendarEvents?: CalendarEventSummary[];
  conversationId: number;
}

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

export interface CalendarEventDateTime {
  date?: string;
  dateTime?: string;
  timeZone?: string;
}

export interface CalendarEventPerson {
  id?: string;
  email?: string;
  displayName?: string;
  self?: boolean;
}

export interface CalendarEventAttendee extends CalendarEventPerson {
  organizer?: boolean;
  optional?: boolean;
  responseStatus?: "needsAction" | "declined" | "tentative" | "accepted";
}

export interface CalendarEventSummary {
  id: string;
  calendarId?: string;
  status?: "tentative" | "confirmed" | "cancelled";
  summary?: string;
  description?: string;
  location?: string;
  start?: CalendarEventDateTime;
  end?: CalendarEventDateTime;
  htmlLink?: string;
  hangoutLink?: string;
  attendees?: CalendarEventAttendee[];
  organizer?: CalendarEventPerson;
  updated?: string;
}

export interface CalendarEventListResponse {
  events: CalendarEventSummary[];
}

export interface IntegrationStatusResponse {
  gmail: "connected" | "missing_credentials" | "not_connected";
  googlecalendar: "connected" | "missing_credentials" | "not_connected";
}
