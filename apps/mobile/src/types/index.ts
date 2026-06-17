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
  cc?: string;
  bcc?: string;
  snippet?: string;
  body?: string;
  /** Sanitizable HTML rendering of the message — only populated by GET /api/emails/:id. */
  bodyHtml?: string;
  labelIds?: string[];
  internalDate?: string | null;
  /** Set only for entries from GET /api/emails/drafts. */
  draftId?: string;
}

export interface EmailListResponse {
  emails: EmailSummary[];
}

export interface EmailDetailResponse {
  email: EmailSummary;
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

export interface EmailSendInput {
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body: string;
  replyToEmailId?: string;
}

export interface EmailSendResponse {
  id?: string;
  to: string;
  subject: string;
  threadId?: string;
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

export interface CalendarEventDetailResponse {
  event: CalendarEventSummary;
}

export interface CalendarEventInput {
  summary?: string;
  description?: string;
  location?: string;
  start?: CalendarEventDateTime;
  end?: CalendarEventDateTime;
  attendees?: CalendarEventAttendee[];
  /** When true, attaches a Google Meet link to the event. */
  addMeetLink?: boolean;
}

export interface CalendarEventMutationResponse {
  event: CalendarEventSummary;
}

export interface CalendarSyncResponse {
  synced: number;
  embedded: number;
}

export type GoogleIntegrationPlugin = "gmail" | "googlecalendar";

export type IntegrationConnectionState = "connected" | "missing_credentials" | "not_connected";

export interface IntegrationStatusResponse {
  gmail: IntegrationConnectionState;
  googlecalendar: IntegrationConnectionState;
}

// ── Subscription / billing ───────────────────────────────────────
export type SubscriptionType = "free" | "pro";

export interface PlanLimits {
  chats: number;
  conversations: number;
  emailSyncs: number;
}

export interface UsageSummary {
  chats: number;
  conversations: number;
  emailSyncs: number;
}

export interface PaymentInfo {
  brand: string | null;
  last4: string | null;
  updatedAt: string | null;
}

export interface SubscriptionResponse {
  subscriptionType: SubscriptionType;
  limits: PlanLimits;
  usage: UsageSummary;
  payment: PaymentInfo;
}
