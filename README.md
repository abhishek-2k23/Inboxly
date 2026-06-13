# AI Hackathon Monorepo

A pnpm + Turborepo monorepo starter for an AI-powered hackathon project.

## Tech stack

| Layer        | Tech                                         |
| ------------ | -------------------------------------------- |
| Frontend     | Next.js (App Router) + Tailwind CSS + TS      |
| Backend      | Express + TypeScript                          |
| Database     | PostgreSQL (via `pg`)                         |
| Cache/Queue  | Redis (via `ioredis`)                         |
| Auth         | Clerk (Google OAuth + email/password)         |
| Validation   | Zod                                           |
| AI           | OpenAI SDK (`openai`)                         |
| Tunneling    | ngrok (optional, via Docker Compose profile)  |
| Tooling      | pnpm workspaces, Turborepo, ESLint, Vitest    |
| CI/CD        | GitHub Actions                                |
| Containers   | Docker + Docker Compose                       |

## Repo structure

```
.
├── apps/
│   ├── web/        # Next.js + Tailwind frontend
│   └── api/        # Express + Postgres + OpenAI backend
├── packages/
│   ├── shared/             # Shared TS types used by web & api
│   ├── eslint-config/       # Shared ESLint flat configs
│   └── typescript-config/   # Shared tsconfig bases
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## Prerequisites

- Node.js >= 20
- [pnpm](https://pnpm.io/) >= 9 (`corepack enable` will pick up the version in `package.json`)
- Docker + Docker Compose (optional, for containerized dev/deploy)

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy environment files and fill in real values:

   ```bash
   cp .env.example .env                  # used by docker-compose
   cp apps/web/.env.example apps/web/.env.local
   cp apps/api/.env.example apps/api/.env
   ```

   At minimum, set `OPENAI_API_KEY` in `apps/api/.env` (and `.env` if using Docker).
   To use authentication, also set the `CLERK_*` variables — see
   [Authentication (Clerk)](#authentication-clerk) below.

## Development (local, no Docker)

Run both apps in dev mode (Turborepo runs them in parallel):

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000 (health check at `/api/health`)

You'll need a local Postgres instance reachable at the `DATABASE_URL` and a local Redis
instance reachable at the `REDIS_URL` in `apps/api/.env`.
The easiest way is to start both via Docker:

```bash
docker compose up postgres redis -d
```

## Linting, type-checking & tests

```bash
pnpm lint        # ESLint across all packages
pnpm type-check  # tsc --noEmit across all packages
pnpm test        # Vitest across all packages
pnpm build       # Build all apps/packages
```

## Running everything with Docker Compose

```bash
docker compose up --build
```

This starts:

- `postgres` on `localhost:5432` (the `vector` extension is enabled on first
  creation via `apps/api/src/db/init.sql`; tables come from Drizzle migrations
  — see [Database (Drizzle ORM)](#database-drizzle-orm))
- `redis` on `localhost:6379`
- `api` on `localhost:4000`
- `web` on `localhost:3000`

> After starting `postgres` for the first time (or after `docker compose down -v`),
> run `pnpm --filter api db:migrate` once to create/update the schema.
>
> The `postgres` service uses the [`pgvector/pgvector:pg16`](https://github.com/pgvector/pgvector)
> image (a drop-in Postgres 16 build with the `vector` extension preinstalled),
> needed for local semantic search over cached emails.

Environment variables are read from `.env` (see `.env.example`).

## Exposing the app with ngrok

1. Set `NGROK_AUTHTOKEN` (and optionally `NGROK_DOMAIN` for a reserved domain) in `.env`.
2. Start the tunnel alongside the rest of the stack:

   ```bash
   docker compose --profile tools up ngrok
   ```

3. The public URL is shown in the `ngrok` container logs, and the inspection
   dashboard is available at http://localhost:4040.

To tunnel a reserved domain, edit the `command` in `docker-compose.yml`:

```yaml
command: ["http", "--url=${NGROK_DOMAIN}", "web:3000"]
```

## Environment variables

See [`.env.example`](./.env.example) for the full list (Postgres credentials, Redis,
API/web ports, `OPENAI_API_KEY`, `OPENAI_MODEL`, `NEXT_PUBLIC_API_URL`, `NGROK_AUTHTOKEN`, etc.).
All values are dummy placeholders — replace them with real secrets locally and never
commit `.env` files (they're gitignored).

## CI/CD

`.github/workflows/ci.yml` runs on every push/PR to `main`:

1. Install dependencies with pnpm
2. `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build`
3. Build the `api` and `web` Docker images to verify the Dockerfiles are healthy

## Backend architecture (`apps/api`)

The API follows a layered structure under `apps/api/src/`:

```
routes/        # Express routers — wire URLs + middleware to controllers
controllers/   # Request handlers — parse req, call services, send res
services/      # Business logic
models/        # Database queries (Drizzle ORM)
validations/   # Zod schemas, used by middleware/validate.ts
middleware/     # auth (Clerk), validation, error handling
lib/           # External client singletons (OpenAI, Redis, Postgres pool)
utils/         # Shared helpers (e.g. asyncHandler)
db/            # Drizzle schema, client, and generated migrations
```

To add a new resource: define a Zod schema in `validations/`, a Drizzle table in
`db/schema/` plus a query module in `models/`, business logic in `services/`, a
handler in `controllers/`, and a router in `routes/` registered in
`routes/index.ts`. Shared request/response types live in
`packages/shared/src/index.ts` so both `apps/web` and `apps/api` stay in sync.

Frontend pages live in `apps/web/src/app`, components in `apps/web/src/components`.

## Database (Drizzle ORM)

`apps/api` uses [Drizzle ORM](https://orm.drizzle.team) over the existing `pg`
pool. Tables are defined in `apps/api/src/db/schema/` (one file per domain,
re-exported from `schema/index.ts`), and queried via the `db` client in
`apps/api/src/db/client.ts`.

Schema changes follow a generate-then-migrate workflow (run from `apps/api/`,
or via `pnpm --filter api <script>` from the repo root):

```bash
pnpm db:generate   # diff schema/ against src/db/migrations and write a new SQL migration
pnpm db:migrate    # apply pending migrations in src/db/migrations to DATABASE_URL
pnpm db:studio     # open Drizzle Studio (browser GUI) against DATABASE_URL
```

These commands read `DATABASE_URL` from `apps/api/.env` (or the environment),
falling back to the same local default as `apps/api/.env.example`. Generated
migration SQL lives in `apps/api/src/db/migrations/` and is committed to git.

`apps/api/src/db/init.sql` now only runs `CREATE EXTENSION IF NOT EXISTS vector`
on first container creation (privileged, one-time setup) — actual tables/enums/
indexes are created by running `pnpm db:migrate` against the database. After
`docker compose up postgres -d`, run `pnpm --filter api db:migrate` once to
create the schema.

## Data model

Beyond `users` and the demo `items` table, this is a Superhuman-style
Gmail/Calendar client backed by [Corsair](https://corsair.dev), a self-hosted
SDK that runs in the API process and manages its own tables in this same
Postgres database (created via `apps/api/src/db/init.sql`, since they're
owned by the `corsair` SDK rather than Drizzle):

- **`corsair_integrations`** / **`corsair_accounts`** — enabled plugins
  (`gmail`, `googlecalendar`, ...) and each user's per-tenant connection +
  encrypted OAuth credentials. Replaces a hand-rolled
  `integration_connections` table.
- **`corsair_entities`** — generic synced cache of Gmail threads/messages and
  Calendar events (`entity_type` + `data` jsonb), kept fresh via API calls and
  webhooks. The UI reads inbox/calendar lists from here via `*.db.*` queries
  instead of custom `emails`/`calendar_events` tables.
- **`corsair_events`** — audit log of Corsair API calls and webhook
  deliveries, processed asynchronously instead of polling Gmail/Calendar.
  Replaces a hand-rolled `webhook_events` table.

Drizzle (`apps/api/src/db/schema/`) only defines the tables Corsair doesn't
cover:

- **`email_ai_meta`** — AI enrichment per Gmail message, keyed by
  `entity_id` (references `corsair_entities.id`). Holds the cheap-LLM
  triage result (`priority` / `priority_reason`) and a `vector(1536)`
  (OpenAI `text-embedding-3-small`) embedding with an HNSW index for
  sub-second local semantic search across the inbox.
- **`chat_conversations`** / **`chat_messages`** — agent chat sessions backed
  by Corsair's MCP, including tool calls/results for "send an email and a
  calendar invite" style requests.

## Authentication (Clerk)

Auth is handled by [Clerk](https://clerk.com), with Google OAuth and email/password
both enabled out of the box once configured:

1. Create an application at [dashboard.clerk.com](https://dashboard.clerk.com).
2. Under **User & authentication**, enable **Google** (Social Connections) and
   **Email** with **Password** (Email, Phone, Username).
3. Copy the **Publishable key** and **Secret key** into `apps/api/.env` (and
   `.env` if using Docker):

   ```
   CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

4. (Optional) To keep the local `users` table in sync with Clerk, add a webhook
   endpoint in **Webhooks** pointing at `<your-public-url>/api/webhooks/clerk`
   (use the [ngrok tunnel](#exposing-the-app-with-ngrok) for local dev),
   subscribed to `user.created`, `user.updated`, and `user.deleted`. Copy the
   **Signing secret** into `CLERK_WEBHOOK_SIGNING_SECRET`.

   Even without the webhook, a local user row is created automatically on first
   authenticated request (`getOrCreateByClerkId` in `apps/api/src/services/user.service.ts`).

`/api/items` and `/api/chat` require authentication; `/api/auth/me` returns the
current user's profile.

## Connecting Gmail & Calendar (Corsair)

Gmail and Google Calendar access is handled by [Corsair](https://corsair.dev),
a self-hosted SDK (`createCorsair()` in `apps/api/src/lib/corsair.ts`) that
manages its own `corsair_*` tables in this database (see
[Data model](#data-model)). Each local user is a Corsair "tenant"
(`tenantId = String(users.id)`).

### 1. Generate `CORSAIR_KEK`

This is the key-encryption key Corsair uses to encrypt stored OAuth tokens:

```bash
openssl rand -base64 32
```

Put the result in `CORSAIR_KEK` in `apps/api/.env` (and root `.env` if using Docker).

### 2. Create a Google OAuth client

One OAuth client covers both Gmail and Calendar:

1. Create/select a project at [console.cloud.google.com](https://console.cloud.google.com/).
2. Under **APIs & Services > Library**, enable the **Gmail API** and the
   **Google Calendar API**.
3. Under **APIs & Services > OAuth consent screen**, configure an **External**
   app (add your account as a test user while it's unpublished).
4. Under **APIs & Services > Credentials**, create an **OAuth client ID** of
   type **Web application**, and add this **Authorized redirect URI**:

   ```
   http://localhost:4000/api/integrations/google/callback
   ```

   (Use `API_BASE_URL` instead of `http://localhost:4000` if you've changed it,
   e.g. to an ngrok URL.)

5. Copy the **Client ID** and **Client secret** into `GOOGLE_CLIENT_ID` and
   `GOOGLE_CLIENT_SECRET` in `apps/api/.env`.

On the next server boot, `initCorsair()` (called from `src/index.ts`) creates
the `corsair_integrations` rows for `gmail`/`googlecalendar` and stores these
credentials encrypted with `CORSAIR_KEK`. If `GOOGLE_CLIENT_ID`/`SECRET` are
missing, it logs which `corsair.keys.<plugin>.set_*()` calls are needed.

### 3. Connect routes

- `GET /api/integrations/google/status` (auth required) — per-plugin
  connection state: `connected` / `missing_credentials` / `not_connected`.
- `GET /api/integrations/google/connect/:plugin` (auth required, `plugin` is
  `gmail` or `googlecalendar`) — redirects to Google's consent screen.
- `GET /api/integrations/google/callback` — Google redirects here after
  consent; exchanges the code for tokens (stored in `corsair_accounts`) and
  redirects to `${WEB_APP_URL}/settings/integrations?connected=<plugin>` (or
  `?error=...`).

### 4. Real-time sync (push notifications)

Both integrations push change notifications to `apps/api`, which re-syncs and
notifies the frontend over SSE (`/api/emails/stream`, `/api/calendar/stream`).
See `apps/api/.env.example` for the full variable descriptions.

- **Gmail** uses Pub/Sub (`users.watch`): set `GMAIL_PUBSUB_TOPIC` to a topic
  that `gmail-api-push@system.gserviceaccount.com` can publish to, and point
  its push subscription at `<API_BASE_URL>/api/webhooks/gmail`. Optionally set
  `GMAIL_WEBHOOK_TOKEN` and append `?token=...` to the subscription URL.
- **Google Calendar** uses `events.watch` and posts directly to
  `<API_BASE_URL>/api/webhooks/calendar` — no Pub/Sub topic needed. This
  requires `API_BASE_URL` to be a public **HTTPS** URL (e.g. an ngrok tunnel,
  see [Exposing the app with ngrok](#exposing-the-app-with-ngrok)); if it
  isn't, watch registration is skipped with a warning. Optionally set
  `CALENDAR_WEBHOOK_TOKEN`, which is sent as the channel `token` and checked
  against the `X-Goog-Channel-Token` header on incoming notifications.

Both watches are registered automatically right after the OAuth callback for
the respective plugin, for any already-connected accounts on server boot, and
renewed twice daily before they expire (see `gmail-watch.service.ts` /
`calendar-watch.service.ts`).
