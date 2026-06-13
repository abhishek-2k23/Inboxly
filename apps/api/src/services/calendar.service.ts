import crypto from "node:crypto";
import type {
  GoogleCalendarEndpointInputs,
  GoogleCalendarEndpointOutputs,
} from "@corsair-dev/googlecalendar";
import type { Event } from "@corsair-dev/googlecalendar/types";
import type {
  CalendarEventInput,
  CalendarEventSearchResult,
  CalendarEventSummary,
} from "@repo/shared";
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
  get: (
    args: GoogleCalendarEndpointInputs["eventsGet"],
  ) => Promise<GoogleCalendarEndpointOutputs["eventsGet"]>;
  create: (
    args: GoogleCalendarEndpointInputs["eventsCreate"],
  ) => Promise<GoogleCalendarEndpointOutputs["eventsCreate"]>;
  update: (
    args: GoogleCalendarEndpointInputs["eventsUpdate"],
  ) => Promise<GoogleCalendarEndpointOutputs["eventsUpdate"]>;
  delete: (
    args: GoogleCalendarEndpointInputs["eventsDelete"],
  ) => Promise<GoogleCalendarEndpointOutputs["eventsDelete"]>;
};

/**
 * The SDK throws a `GoogleCalendarAPIError` (name + numeric `code`, an HTTP
 * status) for non-2xx responses, but doesn't export the class, so we can
 * only detect it duck-typed.
 */
function isNotFoundError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === "GoogleCalendarAPIError" &&
    (error as { code?: number }).code === 404
  );
}

type GoogleCalendarEventsDb = PluginEntityClient<z.ZodType<GoogleCalendarEventData>>;

function getEventsApi(userId: number): GoogleCalendarEventsApi {
  return corsair.withTenant(toTenantId(userId)).googlecalendar.api
    .events as GoogleCalendarEventsApi;
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
  async syncEvents(
    userId: number,
    maxResults = DEFAULT_SYNC_LIMIT,
  ): Promise<{ synced: number; embedded: number }> {
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

  async embedEvent(
    userId: number,
    entityRowId: string,
    data: GoogleCalendarEventData,
  ): Promise<boolean> {
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

  async searchEvents(
    userId: number,
    query: string,
    limit = DEFAULT_SEARCH_LIMIT,
  ): Promise<CalendarEventSearchResult[]> {
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
      results.push({
        ...toCalendarEventSummary(entity.data),
        similarity: matches[index]!.similarity,
      });
    });

    return results;
  },

  async getEvent(userId: number, id: string): Promise<CalendarEventSummary | null> {
    const eventsDb = getEventsDb(userId);
    const cached = await eventsDb.findByEntityId(id);
    if (cached) return toCalendarEventSummary(cached.data);

    const eventsApi = getEventsApi(userId);
    try {
      const event = await eventsApi.get({ calendarId: DEFAULT_CALENDAR_ID, id });
      if (!event.id) return null;

      const data: GoogleCalendarEventData = {
        ...event,
        id: event.id,
        calendarId: DEFAULT_CALENDAR_ID,
        createdAt: new Date(),
        eventType: sanitizeEventType(event.eventType),
      };

      const entity = await eventsDb.upsertByEntityId(data.id, data);
      await calendarService.embedEvent(userId, entity.id, data);

      return toCalendarEventSummary(data);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  },

  async createEvent(userId: number, input: CalendarEventInput): Promise<CalendarEventSummary> {
    const eventsApi = getEventsApi(userId);
    const created = await eventsApi.create({
      calendarId: DEFAULT_CALENDAR_ID,
      event: {
        summary: input.summary,
        description: input.description,
        location: input.location,
        start: input.start,
        end: input.end,
        attendees: input.attendees,
      },
    });

    if (!created.id) {
      throw new Error("Google Calendar did not return an event id");
    }

    const data: GoogleCalendarEventData = {
      ...created,
      id: created.id,
      calendarId: DEFAULT_CALENDAR_ID,
      createdAt: new Date(),
      eventType: sanitizeEventType(created.eventType),
    };

    const entity = await getEventsDb(userId).upsertByEntityId(data.id, data);
    await calendarService.embedEvent(userId, entity.id, data);

    return toCalendarEventSummary(data);
  },

  async updateEvent(
    userId: number,
    id: string,
    input: CalendarEventInput,
  ): Promise<CalendarEventSummary | null> {
    const eventsApi = getEventsApi(userId);
    try {
      const updated = await eventsApi.update({
        calendarId: DEFAULT_CALENDAR_ID,
        id,
        event: {
          summary: input.summary,
          description: input.description,
          location: input.location,
          start: input.start,
          end: input.end,
          attendees: input.attendees,
        },
      });

      if (!updated.id) return null;

      const data: GoogleCalendarEventData = {
        ...updated,
        id: updated.id,
        calendarId: DEFAULT_CALENDAR_ID,
        eventType: sanitizeEventType(updated.eventType),
      };

      const entity = await getEventsDb(userId).upsertByEntityId(data.id, data);
      await calendarService.embedEvent(userId, entity.id, data);

      return toCalendarEventSummary(data);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  },

  async deleteEvent(userId: number, id: string): Promise<boolean> {
    const eventsApi = getEventsApi(userId);
    try {
      await eventsApi.delete({ calendarId: DEFAULT_CALENDAR_ID, id });
    } catch (error) {
      if (!isNotFoundError(error)) throw error;
    }

    const eventsDb = getEventsDb(userId);
    const entity = await eventsDb.findByEntityId(id);
    if (!entity) return false;

    await eventsDb.deleteById(entity.id);
    await calendarAiMetaModel.deleteByEntityId(userId, entity.id);
    return true;
  },
};
