# AI Hackathon Monorepo

A pnpm + Turborepo monorepo starter for an AI-powered hackathon project.

## Tech stack

| Layer        | Tech                                         |
| ------------ | -------------------------------------------- |
| Frontend     | Next.js (App Router) + Tailwind CSS + TS      |
| Backend      | Express + TypeScript                          |
| Database     | PostgreSQL (via `pg`)                         |
| Cache/Queue  | Redis (via `ioredis`)                         |
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

- `postgres` on `localhost:5432` (schema bootstrapped from `apps/api/src/db/init.sql`)
- `redis` on `localhost:6379`
- `api` on `localhost:4000`
- `web` on `localhost:3000`

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

## Adding API routes / pages

- Backend routes live in `apps/api/src/routes`, registered in `apps/api/src/app.ts`.
- Shared request/response types live in `packages/shared/src/index.ts` so both
  `apps/web` and `apps/api` stay in sync.
- Frontend pages live in `apps/web/src/app`, components in `apps/web/src/components`.
