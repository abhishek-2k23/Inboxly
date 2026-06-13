import crypto from "node:crypto";
import type { GoogleCalendarEndpointInputs, GoogleCalendarEndpointOutputs } from "@corsair-dev/googlecalendar";
import type { Event } from "@corsair-dev/googlecalendar/types";
import type { CalendarEventSearchResult, CalendarEventSummary } from "@repo/shared";
import type { PluginEntityClient } from "corsair/orm";
import type { z } from "zod";
import { corsair, toTenantId } from "../lib/corsair.js";
import { openai } from "../lib/openai.js";
import { calendarAiMetaModel } from "../models/calendar.model.js";

// `@corsair-dev/googlecalendar` does not export its zod `GoogleCalendarSchema`
// (unlike `@corsair-dev/gmail`'s `GmailSchema`), so the entity data shape is
// derived from the public `Event` type plus the extra fields the plugin's
// `db.events.upsertByEntityId` call stores (`calendarId`, `createdAt`).
export type GoogleCalendarEventData = Omit<Event, "id"> & {
  id: string;
  calendarId?: string;
  createdAt?: Date;
};

/**
 * The corsair tenant client's plugin namespaces (`client.googlecalendar.api`/`.db`)
 * are inferred as `any` by the SDK for this plugin combination, so we cast the
 * two surfaces we use to their documented shapes at this single boundary.
 */
type GoogleCalendarEventsApi = {
  getMany: (
    args: GoogleCalendarEndpointInputs["eventsGetMany"],
  ) => Promise<GoogleCalendarEndpointOutputs["eventsGetMany"]>;
};

type GoogleCalendarEventsDb = PluginEntityClient<z.ZodType<GoogleCalendarEventData>>;

function getEventsApi(userId: number): GoogleCalendarEventsApi {
  return corsair.withTenant(toTenantId(userId)).googlecalendar.api.events as GoogleCalendarEventsApi;
}

function getEventsDb(userId: number): GoogleCalendarEventsDb {
  return corsair.withTenant(toTenantId(userId)).googlecalendar.db.events as GoogleCalendarEventsDb;
}

const EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_CALENDAR_ID = "primary";
const DEFAULT_SYNC_LIMIT = 50;
const MAX_SYNC_LIMIT = 500;
const SYNC_PAGE_SIZE = 50;
const DEFAULT_LIST_LIMIT = 20;
const DEFAULT_SEARCH_LIMIT = 10;

function toCalendarEventSummary(data: GoogleCalendarEventData): CalendarEventSummary {
  return {
    id: data.id,
    calendarId: data.calendarId,
    status: data.status,
    summary: data.summary,
    description: data.description,
    location: data.location,
    start: data.start,
    end: data.end,
    htmlLink: data.htmlLink,
    hangoutLink: data.hangoutLink,
    attendees: data.attendees,
    organizer: data.organizer,
    creator: data.creator,
    recurrence: data.recurrence,
    updated: data.updated,
  };
}

function buildEventText(data: GoogleCalendarEventData): string {
  const parts: string[] = [];

  if (data.summary) parts.push(data.summary);
  if (data.description) parts.push(data.description);
  if (data.location) parts.push(`Location: ${data.location}`);

  const start = data.start?.dateTime ?? data.start?.date;
  const end = data.end?.dateTime ?? data.end?.date;
  if (start) parts.push(`Start: ${start}`);
  if (end) parts.push(`End: ${end}`);

  const attendees = data.attendees
    ?.map((attendee) => attendee.displayName ?? attendee.email)
    .filter((value): value is string => Boolean(value));
  if (attendees?.length) parts.push(`Attendees: ${attendees.join(", ")}`);

  return parts.join("\n");
}

function buildContentHash(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

// The real Google Calendar API can return `eventType` values (e.g. "birthday",
// "fromGmail") that the SDK's cached-entity zod schema doesn't include, which
// makes `eventsDb.upsertByEntityId` throw a ZodError. Drop unsupported values.
const SUPPORTED_EVENT_TYPES = new Set<GoogleCalendarEventData["eventType"]>([
  "default",
  "outOfOffice",
  "focusTime",
  "workingLocation",
]);

function sanitizeEventType(eventType: string | undefined): GoogleCalendarEventData["eventType"] {
  return SUPPORTED_EVENT_TYPES.has(eventType as GoogleCalendarEventData["eventType"])
    ? (eventType as GoogleCalendarEventData["eventType"])
    : undefined;
}

export const calendarService = {
  async syncEvents(userId: number, maxResults = DEFAULT_SYNC_LIMIT): Promise<{ synced: number; embedded: number }> {
    const eventsApi = getEventsApi(userId);
    const eventsDb = getEventsDb(userId);
    const total = Math.min(maxResults, MAX_SYNC_LIMIT);

    let synced = 0;
    let embedded = 0;
    let pageToken: string | undefined;

    do {
      const { items, nextPageToken } = await eventsApi.getMany({
        calendarId: DEFAULT_CALENDAR_ID,
        maxResults: Math.min(SYNC_PAGE_SIZE, total - synced),
        pageToken,
        singleEvents: true,
        orderBy: "startTime",
        timeMin: new Date().toISOString(),
      });

      for (const event of items ?? []) {
        if (!event.id) continue;

        const data: GoogleCalendarEventData = {
          ...event,
          id: event.id,
          calendarId: DEFAULT_CALENDAR_ID,
          createdAt: new Date(),
          eventType: sanitizeEventType(event.eventType),
        };

        const entity = await eventsDb.upsertByEntityId(data.id, data);
        synced += 1;

        const wasEmbedded = await calendarService.embedEvent(userId, entity.id, data);
        if (wasEmbedded) embedded += 1;
      }

      pageToken = nextPageToken;
    } while (pageToken && synced < total);

    return { synced, embedded };
  },

  async embedEvent(userId: number, entityRowId: string, data: GoogleCalendarEventData): Promise<boolean> {
    const text = buildEventText(data);
    if (!text) return false;

    const contentHash = buildContentHash(text);
    const existing = await calendarAiMetaModel.findByEntityId(userId, entityRowId);
    if (existing?.contentHash === contentHash) return false;

    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8000),
    });

    const embedding = embeddingResponse.data[0]?.embedding;
    if (!embedding) return false;

    await calendarAiMetaModel.upsertEmbedding(userId, entityRowId, embedding, contentHash);
    return true;
  },

  async listEvents(
    userId: number,
    options: { limit?: number; offset?: number } = {},
  ): Promise<CalendarEventSummary[]> {
    const eventsDb = getEventsDb(userId);
    const entities = await eventsDb.list({
      limit: options.limit ?? DEFAULT_LIST_LIMIT,
      offset: options.offset ?? 0,
    });
    return entities.map((entity) => toCalendarEventSummary(entity.data));
  },

  async searchEvents(userId: number, query: string, limit = DEFAULT_SEARCH_LIMIT): Promise<CalendarEventSearchResult[]> {
    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query,
    });

    const embedding = embeddingResponse.data[0]?.embedding;
    if (!embedding) return [];

    const matches = await calendarAiMetaModel.searchByEmbedding(userId, embedding, limit);
    if (matches.length === 0) return [];

    const eventsDb = getEventsDb(userId);
    const entities = await Promise.all(matches.map((match) => eventsDb.findById(match.entityId)));

    const results: CalendarEventSearchResult[] = [];
    entities.forEach((entity, index) => {
      if (!entity) return;
      results.push({ ...toCalendarEventSummary(entity.data), similarity: matches[index]!.similarity });
    });

    return results;
  },
};
