export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  timeZone?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  calendarEvents?: CalendarEventSummary[];
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
  resource?: boolean;
  optional?: boolean;
  responseStatus?: "needsAction" | "declined" | "tentative" | "accepted";
  comment?: string;
  additionalGuests?: number;
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
  creator?: CalendarEventPerson;
  recurrence?: string[];
  updated?: string;
}

export interface CalendarEventListResponse {
  events: CalendarEventSummary[];
}

export interface CalendarSyncResponse {
  synced: number;
  embedded: number;
}

export interface CalendarEventSearchResult extends CalendarEventSummary {
  similarity: number;
}

export interface CalendarEventSearchResponse {
  results: CalendarEventSearchResult[];
}

export interface CalendarEventInput {
  summary?: string;
  description?: string;
  location?: string;
  start?: CalendarEventDateTime;
  end?: CalendarEventDateTime;
  attendees?: CalendarEventAttendee[];
}

export interface CalendarEventDetailResponse {
  event: CalendarEventSummary;
}

export interface CalendarEventMutationResponse {
  event: CalendarEventSummary;
}
