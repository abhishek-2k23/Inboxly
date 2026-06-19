<div align="center">

```
 █████╗ ██████╗  ██████╗██╗  ██╗██╗████████╗███████╗ ██████╗████████╗██╗   ██╗██████╗ ███████╗
██╔══██╗██╔══██╗██╔════╝██║  ██║██║╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗██╔════╝
███████║██████╔╝██║     ███████║██║   ██║   █████╗  ██║        ██║   ██║   ██║██████╔╝█████╗
██╔══██║██╔══██╗██║     ██╔══██║██║   ██║   ██╔══╝  ██║        ██║   ██║   ██║██╔══██╗██╔══╝
██║  ██║██║  ██║╚██████╗██║  ██║██║   ██║   ███████╗╚██████╗   ██║   ╚██████╔╝██║  ██║███████╗
╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝
```

# 🏗 Architecture

### How Inboxly is put together — from a prompt box to Gmail and back.

[**← Back to README**](./README.md) &nbsp;·&nbsp; [**🔐 Security**](./SECURITY.md) &nbsp;·&nbsp; [**🤝 Contributing**](./CONTRIBUTING.md)

</div>

---

## 📑 Table of Contents

- [System Overview](#-system-overview)
- [Monorepo Layout](#-monorepo-layout)
- [Backend Layering](#-backend-layering)
- [The Chat Agent (Tool-Calling Loop)](#-the-chat-agent-tool-calling-loop)
- [Google Access via Corsair](#-google-access-via-corsair)
- [Data Model & Storage](#-data-model--storage)
- [Semantic Search Pipeline](#-semantic-search-pipeline)
- [Real-Time Sync (Push → SSE)](#-real-time-sync-push--sse)
- [Request Lifecycle (End to End)](#-request-lifecycle-end-to-end)
- [Plans, Usage & Billing](#-plans-usage--billing)
- [Cross-Cutting Concerns](#-cross-cutting-concerns)
- [Key Design Decisions](#-key-design-decisions)

---

## 🌐 System Overview

Inboxly is an **AI-native email + calendar client**. A single conversational agent sits in front of Gmail and Google Calendar; the user types intent in plain English and the agent decides which tools to call, executes them against the real Google APIs (through Corsair), and reports back.

```
                         ┌─────────────────────────────────────────────┐
                         │                inboxly.fun                  │
                         │      Next.js 15 · React 19 · Tailwind v4     │
                         │   Zustand stores · Clerk · SSE listeners     │
                         └───────────────┬─────────────────────────────┘
                                         │  HTTPS (Bearer JWT)
                                         ▼
            ┌────────────────────────────────────────────────────────────────┐
            │             inboxly-3cfo.onrender.com  (Express API)            │
            │                                                                  │
            │  routes → controllers → services → models → db                   │
            │                                                                  │
            │  ┌── chat.service ──────────────┐   ┌── email/calendar.service ─┐ │
            │  │ OpenAI tool-calling loop     │──▶│ Corsair Gmail/Calendar    │ │
            │  │ (search/send/draft/schedule) │   │ plugins (api + db cache)  │ │
            │  └──────────────────────────────┘   └───────────────────────────┘ │
            └───────┬───────────────────────┬───────────────────────┬──────────┘
                    │                       │                       │
              ┌─────▼─────┐          ┌──────▼──────┐         ┌───────▼───────┐
              │  OpenAI   │          │  PostgreSQL  │        │ Google APIs    │
              │ chat +    │          │  + pgvector  │        │ Gmail/Calendar │
              │ embeddings│          │ corsair_* +  │        │ (via Corsair)  │
              └───────────┘          │ drizzle      │        └───────┬───────┘
                                     │ tables       │                │ push
                                     └──────────────┘        ┌───────▼───────┐
                                                             │ Pub/Sub +     │
                                                             │ events.watch  │
                                                             │ → /webhooks/* │
                                                             └───────────────┘
```

Three planes worth keeping distinct in your head:

1. **Control plane** — the browser talks only to the Express API over HTTPS with a Clerk Bearer JWT.
2. **Data plane** — all mail/calendar reads come from a **local Postgres cache** (the Corsair entity cache), never live round-trips to Google on every list.
3. **Event plane** — Google pushes changes to webhooks; the API re-syncs and fans out to browsers over **SSE**. No polling.

---

## 📦 Monorepo Layout

A **pnpm workspaces + Turborepo** monorepo. Types are shared so the web app and API can never drift.

```
.
├── apps/
│   ├── web/          # Next.js 15 (App Router) + Tailwind v4 frontend
│   └── api/          # Express + Postgres + OpenAI + Corsair backend
├── packages/
│   ├── shared/       # Shared request/response TS types (single source of truth)
│   ├── eslint-config/        # Shared flat ESLint configs
│   └── typescript-config/    # Shared tsconfig bases
├── docker-compose.yml        # postgres (pgvector), redis, api, web, ngrok
├── turbo.json · pnpm-workspace.yaml
└── .github/workflows/ci.yml  # lint · type-check · test · build · docker
```

`packages/shared` is the contract between the two apps: every request body and response shape is defined once and imported on both sides, so a route change that breaks the client fails type-check immediately.

---

## 🧱 Backend Layering

The API (`apps/api/src/`) is a strict, one-directional layering. Each layer only knows about the one below it:

```
routes/        wire URLs + middleware (auth, validation)
   │
controllers/   parse the request, shape the HTTP response
   │
services/      business logic (the brains: chat, email, calendar, account…)
   │
models/        Drizzle queries — the only place that touches SQL
   │
db/            schema/, migrations/, init.sql
```

| Directory      | Responsibility                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `routes/`      | URL → middleware → controller wiring (`auth`, `account`, `chat`, `email`, `calendar`, `integration`, `payment`, `webhook`, `health`). |
| `controllers/` | Translate HTTP ⇄ service calls; never contain business rules.                                                                         |
| `services/`    | Where the actual work lives: `chat`, `email`, `calendar`, `account`, `payment`, `user`, `gmail-watch`, `calendar-watch`.              |
| `models/`      | Drizzle query builders — the **only** layer that issues SQL.                                                                          |
| `validations/` | Zod schemas, applied by the `validate` middleware before a controller runs.                                                           |
| `middleware/`  | Cross-cutting: Clerk auth (`requireAuthenticated` + `attachUser`), Zod `validate`, central `errorHandler`.                            |
| `lib/`         | Singletons & adapters: `openai`, `corsair`, db client, `redis`, plus `markdown`, `gmail-message`, event emitters.                     |

**Why this matters:** business logic is testable in isolation (Vitest hits services directly), SQL is confined to one layer, and HTTP concerns never leak into the agent logic.

---

## 🤖 The Chat Agent (Tool-Calling Loop)

The heart of Inboxly is `chat.service.ts` — an OpenAI **tool-calling loop** behind `POST /api/chat`.

**Flow per turn:**

1. Build a rich **system prompt**: the user's name/email (for signatures), local date/time + timezone (for relative-date resolution like "next Tuesday 3pm"), and any attachment context from the prompt box.
2. Replay **persisted history** from `chat_conversations` / `chat_messages` — including prior assistant `tool_calls` and `tool` results — so the agent has full context.
3. Call the model with the tool schemas and **iterate up to `MAX_TOOL_ITERATIONS` rounds** (`for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; …)`), executing tools and feeding results back until the model produces a final answer.
4. Persist every message of the turn and return the reply, any created calendar events, the `conversationId`, and `emailSent`.

**The eight tools:**

| Tool                     | Purpose                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `search_emails`          | Semantic (vector) search by topic/sender, or list most recent (`mode: recent`/`search`). |
| `send_email`             | Send via Gmail; threads replies (`replyToEmailId`); auto-includes prompt attachments.    |
| `create_draft`           | Save a Gmail draft instead of sending.                                                   |
| `archive_email`          | Remove a message from the inbox (stays searchable).                                      |
| `create_calendar_event`  | Schedule events; resolves local date-times; attendees + Google Meet.                     |
| `search_calendar_events` | Query the calendar by range/keyword.                                                     |
| `update_calendar_event`  | Reschedule/edit (merges over existing event so omitted fields aren't cleared).           |
| `delete_calendar_event`  | Cancel an event (confirmation-guarded).                                                  |

**Reliability touches built into the loop:**

- **Tool-aware persistence** — the full `tool_calls`/`tool` exchange is replayed next turn.
- **Safe-by-default** — confirms or prefers drafting before _sending_ or _deleting_ unless the user clearly asked.
- **Honest errors** — if a tool returns `{ success: false, error }`, the agent must relay it; a server-side safety net surfaces the error even when the model returns an empty reply.
- **Fresh retries** — a failed turn never blocks the next; a follow-up is treated as a new attempt with full prior context.

---

## 🔗 Google Access via Corsair

**Every** Gmail/Calendar data operation goes through **[Corsair](https://corsair.dev)** — a self-hosted SDK embedded in the API process (`createCorsair()` in `apps/api/src/lib/corsair.ts`). Corsair owns OAuth, **token encryption**, an entity cache, and a webhook event log.

- Each Inboxly user is a Corsair **tenant**: `tenantId = String(users.id)`.
- All access is `corsair.withTenant(tenantId).gmail.*` / `.googlecalendar.*` — the app **never** calls `googleapis` directly for data operations.
- The **only** raw Google calls are the push-notification _watch_ registrations (`users.watch` / `events.watch`).
- On boot, `initCorsair()` registers the `gmail`/`googlecalendar` integrations and stores credentials encrypted with `CORSAIR_KEK`.

This is the single most important boundary in the system: it means token handling, encryption, and the Google cache are all in one audited place rather than smeared across services.

---

## 🗄 Data Model & Storage

Schema is split between **Corsair-owned** tables (Google data + OAuth) and **Drizzle-owned** tables (app-specific data).

**Corsair tables** (`apps/api/src/db/init.sql`, managed by the SDK):

- `corsair_integrations` / `corsair_accounts` — enabled plugins + each tenant's **encrypted** OAuth connection.
- `corsair_entities` — generic synced cache of Gmail messages & Calendar events (`entity_type` + `data` jsonb). **All list/detail views read from here.**
- `corsair_events` — audit log of API calls and webhook deliveries, processed asynchronously.

**Drizzle tables** (`apps/api/src/db/schema/`, generate-then-migrate workflow):

- `users` — local mirror of the Clerk user, plan/subscription state, usage meters (`chats_used`, `email_syncs_used`).
- `email_ai_meta` — AI enrichment per message keyed by `entity_id`: cheap-LLM triage (`priority`/`priority_reason`) + a `vector(1536)` embedding with an **HNSW index**.
- `chat_conversations` / `chat_messages` — agent sessions, including tool calls/results.
- `payments` — Razorpay payment history.

**Migration workflow (Drizzle):**

```bash
pnpm --filter api db:generate   # diff schema/ → new SQL migration
pnpm --filter api db:migrate    # apply pending migrations
pnpm --filter api db:studio     # browser GUI over the DB
```

---

## 🔍 Semantic Search Pipeline

```
sync email ──▶ store in corsair_entities ──▶ embed body (text-embedding-3-small)
                                                    │
                                                    ▼
                                      email_ai_meta.embedding  vector(1536)
                                                    │  HNSW index
   user query ──▶ embed query ──▶ pgvector nearest-neighbour ──▶ cheap-LLM
                                                                relevance re-rank ──▶ results
```

Every synced email body is embedded with `text-embedding-3-small` and stored as a `vector(1536)` in `email_ai_meta`, indexed with **pgvector HNSW** for sub-second nearest-neighbour search. A cheap-LLM relevance layer re-ranks candidates so _"the email about the roadmap from Priya"_ resolves correctly even when the exact words are misremembered.

---

## ⚡ Real-Time Sync (Push → SSE)

No polling. Inboxly stays live through Google **push notifications**:

- **Gmail** → Google Cloud **Pub/Sub** (`users.watch`) → `POST /api/webhooks/gmail`.
- **Calendar** → `events.watch` channels → `POST /api/webhooks/calendar` (needs a public HTTPS `API_BASE_URL`).

On a push: the API re-syncs the affected data and publishes an event the browser receives over **SSE** (`/api/emails/stream`, `/api/calendar/stream`), so lists refresh on their own.

**Watch lifecycle:** registered right after OAuth, re-registered for connected accounts on boot, and **renewed twice daily** before their ~7-day expiry (`gmail-watch.service.ts` / `calendar-watch.service.ts`), with per-user throttling to stay under Google's rate limits.

---

## 🔄 Request Lifecycle (End to End)

A _"reply to Priya and attach the deck"_ request, traced through the stack:

```
Browser (PromptBox + attachment)
   │  POST /api/chat  { messages, attachments, timeZone, conversationId }
   ▼
requireAuthenticated → attachUser        # Clerk JWT verified, local user attached
   ▼
validate (Zod schema)                    # body shape enforced
   ▼
chat.controller → chat.service           # build system prompt + replay history
   ▼
OpenAI tool-calling loop                 # model decides: search_emails → send_email
   │        │
   │        └─▶ corsair.withTenant(id).gmail.send(...)   # real Gmail API
   ▼
persist turn (chat_messages)             # incl. tool_calls + tool results
   ▼
response { reply, emailSent, conversationId, calendarEvents }
```

Meanwhile, the Gmail send triggers a Pub/Sub push → `/api/webhooks/gmail` → re-sync → SSE → the Sent list updates live in the open browser tab.

---

## 💳 Plans, Usage & Billing

Limits are **server-authoritative** (`PLAN_LIMITS` in `account.service.ts`):

| Meter               | Meaning                        | Free | Pro   |
| ------------------- | ------------------------------ | ---- | ----- |
| **Chats**           | New chats you can start        | 50   | ∞     |
| **Chat depth**      | Messages within a single chat  | 5    | ∞     |
| **Email syncs**     | Cache sync operations          | 100  | ∞     |
| **Attachment size** | Per-file cap on outgoing email | 5 MB | 10 MB |

- **Chat depth** is enforced server-side in the completion path _and_ with a client-side pre-check (`402 limit:chatDepth`).
- **Switching plans resets every usage meter** (folded into `setSubscription`), so up/downgrade returns a fresh allowance and the UI updates instantly from that response.
- Upgrades flow through **Razorpay**: create order → user pays → **signature verification** → upgrade.

---

## 🧩 Cross-Cutting Concerns

| Concern            | Where it lives                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Auth**           | Clerk (`requireAuthenticated`) + `attachUser` (lazily mirrors the Clerk user into `users`, best-effort `touchLastActive`). |
| **Validation**     | Zod schemas in `validations/`, applied by the `validate` middleware.                                                       |
| **Errors**         | Central `errorHandler` middleware; `asyncHandler` wraps async routes.                                                      |
| **Observability**  | Sentry (API + web).                                                                                                        |
| **Config**         | Environment-variable driven (see README's [Configuration](./README.md#-configuration-environment-variables)).              |
| **Caching/queues** | Redis (`lib/redis.ts`).                                                                                                    |

---

## 🧠 Key Design Decisions

- **Cache-first reads.** Lists never hit Google live — they read `corsair_entities`. Push notifications keep the cache fresh, so reads are fast _and_ consistent.
- **One Google boundary (Corsair).** All OAuth, token encryption, and data access funnel through one SDK; the rest of the app stays Google-agnostic.
- **Server-authoritative limits.** The client may pre-check for UX, but the server is the source of truth for every meter.
- **Shared types, not duplicated DTOs.** `packages/shared` makes the API↔web contract a compile-time guarantee.
- **Honest agent.** The tool loop is built to surface real failures rather than hallucinate success — see the chat-service safety net.
- **Push over poll.** SSE + Pub/Sub + `events.watch` means near-real-time UI with no busy-loops hammering Google.

---

<div align="center">

[**← README**](./README.md) &nbsp;·&nbsp; [**🔐 Security**](./SECURITY.md) &nbsp;·&nbsp; [**🤝 Contributing**](./CONTRIBUTING.md)

**Built with ☕ and a lot of tool-calls.**

</div>
