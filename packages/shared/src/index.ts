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

export type SubscriptionType = "free" | "pro";

/** Per-plan caps. A value of -1 means unlimited. */
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
  /** ISO timestamp of the last subscription change. */
  updatedAt: string | null;
}

export interface SubscriptionResponse {
  subscriptionType: SubscriptionType;
  limits: PlanLimits;
  usage: UsageSummary;
  payment: PaymentInfo;
}

export interface UpgradeRequest {
  cardNumber: string;
  cardName?: string;
}

export interface CreateOrderRequest {
  plan: "pro";
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface ChatUsageRequest {
  newConversation?: boolean;
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
  cc?: string;
  bcc?: string;
  snippet?: string;
  body?: string;
  /** Sanitizable HTML rendering of the message, when Gmail provided one. Only populated by `GET /api/emails/:id`. */
  bodyHtml?: string;
  labelIds?: string[];
  internalDate?: string | null;
  /** Set only for entries returned by `GET /api/emails/drafts` - the Gmail draft's own id, distinct from the underlying message id. */
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

export interface DraftSendResponse {
  id?: string;
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
  /** When true, attaches a Google Meet video-conference link to the event. */
  addMeetLink?: boolean;
}

export interface CalendarEventDetailResponse {
  event: CalendarEventSummary;
}

export interface CalendarEventMutationResponse {
  event: CalendarEventSummary;
}
