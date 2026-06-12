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

## Data model (`apps/api/src/db/init.sql`)

Beyond `users` and the demo `items` table, the schema models a Superhuman-style
Gmail/Calendar client backed by [Corsair](https://corsair.so):

- **`integration_connections`** — a user's connected Google account (Gmail +
  Calendar), brokered through Corsair. One per user.
- **`email_threads`** / **`emails`** / **`email_attachments`** — Gmail threads
  and messages cached locally for fast list/search views and so the LLM
  priority filter and embeddings have something to read.
- **`email_embeddings`** — `vector(1536)` (OpenAI `text-embedding-3-small`)
  embeddings per email with an HNSW index, for sub-second local semantic search
  across the whole inbox.
- **`calendars`** / **`calendar_events`** — Google Calendars and events,
  cached locally for the schedule UI and invite/update flows.
- **`chat_conversations`** / **`chat_messages`** — agent chat sessions backed
  by Corsair's MCP, including tool calls/results for "send an email and a
  calendar invite" style requests.
- **`webhook_events`** — raw Corsair webhook deliveries (new emails, calendar
  changes), processed asynchronously instead of polling the Gmail/Calendar
  APIs.

`emails.priority` / `priority_reason` hold the cheap-LLM triage result for
automatic email filtering.

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
