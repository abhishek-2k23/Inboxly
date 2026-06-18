<div align="center">

```
 ██████╗ ██████╗ ███╗   ██╗████████╗██████╗ ██╗██████╗ ██╗   ██╗████████╗██╗███╗   ██╗ ██████╗
██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔══██╗██║██╔══██╗██║   ██║╚══██╔══╝██║████╗  ██║██╔════╝
██║     ██║   ██║██╔██╗ ██║   ██║   ██████╔╝██║██████╔╝██║   ██║   ██║   ██║██╔██╗ ██║██║  ███╗
██║     ██║   ██║██║╚██╗██║   ██║   ██╔══██╗██║██╔══██╗██║   ██║   ██║   ██║██║╚██╗██║██║   ██║
╚██████╗╚██████╔╝██║ ╚████║   ██║   ██║  ██║██║██████╔╝╚██████╔╝   ██║   ██║██║ ╚████║╚██████╔╝
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═════╝  ╚═════╝    ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝
```

# 🤝 Contributing

### Thanks for helping make Inboxly better. Here's how to get set up and ship cleanly.

[**← Back to README**](./README.md) &nbsp;·&nbsp; [**🏗 Architecture**](./ARCHITECTURE.md) &nbsp;·&nbsp; [**🔐 Security**](./SECURITY.md)

</div>

---

## 📑 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Ways to Contribute](#-ways-to-contribute)
- [Development Setup](#-development-setup)
- [Project Structure (Where Things Live)](#-project-structure-where-things-live)
- [Branching & Workflow](#-branching--workflow)
- [Commit Conventions](#-commit-conventions)
- [Coding Standards](#-coding-standards)
- [Quality Gates (Run Before You Push)](#-quality-gates-run-before-you-push)
- [Database Changes](#-database-changes)
- [Pull Request Checklist](#-pull-request-checklist)
- [Reporting Bugs & Requesting Features](#-reporting-bugs--requesting-features)
- [Security Issues](#-security-issues)

---

## 📜 Code of Conduct

Be respectful, assume good intent, and keep discussions focused on the work. Harassment or dismissive behavior isn't welcome. By participating you agree to uphold a friendly, inclusive environment for everyone.

---

## ✨ Ways to Contribute

- 🐛 **Fix a bug** — grab an open issue or file one first.
- ✨ **Add a feature** — open an issue to discuss scope before large work.
- 📝 **Improve docs** — README, this guide, code comments.
- 🧪 **Add tests** — services and routes always welcome more coverage.
- 🎨 **Polish UI/UX** — accessibility, responsiveness, micro-interactions.

For anything non-trivial, **open an issue first** so we can align on approach before you invest time.

---

## 🛠 Development Setup

### Prerequisites

- **Node.js ≥ 20** (the repo declares `"engines": { "node": ">=20" }`)
- **pnpm ≥ 9** (`corepack enable`)
- **Docker + Docker Compose** (for Postgres/Redis, or the full stack)

### Quick start

```bash
# 1. Install
pnpm install

# 2. Configure (copy and fill in real values)
cp .env.example .env                         # docker-compose
cp apps/api/.env.example apps/api/.env        # API secrets
cp apps/web/.env.example apps/web/.env.local  # web (NEXT_PUBLIC_*)

# 3. Start Postgres (pgvector) + Redis
docker compose up postgres redis -d

# 4. Create the schema (first run, or after `docker compose down -v`)
pnpm --filter api db:migrate

# 5. Run both apps (Turborepo, parallel)
pnpm dev
```

- **Web** → http://localhost:3000
- **API** → http://localhost:4000 (health: `/api/health`)

For local push notifications, expose the API over HTTPS with ngrok:

```bash
docker compose --profile tools up ngrok    # public URL in logs; inspector at :4040
```

> You'll need credentials for OpenAI, Clerk, a Google OAuth client, and (for billing work) Razorpay. See the [Configuration](./README.md#-configuration-environment-variables) section of the README and [SECURITY.md](./SECURITY.md#-secrets--configuration) for what each secret is.

---

## 🗂 Project Structure (Where Things Live)

A quick map so your change lands in the right layer (full detail in [ARCHITECTURE.md](./ARCHITECTURE.md)):

```
apps/web/      Next.js 15 frontend  (app/, components/, stores/, hooks/, lib/api.ts)
apps/api/      Express backend      (routes → controllers → services → models → db)
packages/shared/   Shared request/response TS types — change the contract here
```

**Backend rule of thumb:** business logic goes in `services/`, SQL only in `models/`, HTTP shaping in `controllers/`, URL/middleware wiring in `routes/`, request schemas in `validations/`. If you change a request/response shape, update `packages/shared` so both apps stay in sync.

---

## 🌱 Branching & Workflow

1. **Fork** the repo (external contributors) or branch off `main`.
2. Create a focused branch:
   ```bash
   git checkout -b feat/calendar-recurring-events
   # or  fix/draft-send-threading
   ```
3. Make your change, keeping commits small and logical.
4. Run the [quality gates](#-quality-gates-run-before-you-push).
5. Push and open a PR against `main`.

Keep PRs **scoped to one concern** — it makes review faster and history cleaner.

---

## 📝 Commit Conventions

This repo follows **[Conventional Commits](https://www.conventionalcommits.org/)** (matching the existing history, e.g. `feat:`, `fix:`):

```
<type>: <short, imperative summary>

[optional body explaining the why]
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `style`, `perf`.

Examples from this project's style:

```
feat: add sent and draft feature
fix: improve ai context, chat and conversation depth values
fix: login routes and add packages
docs: add readme
```

---

## 🧹 Coding Standards

- **TypeScript everywhere** (ESM). Prefer explicit, shared types from `packages/shared` over duplicated DTOs.
- **ESLint + Prettier** are enforced; match the surrounding code's style and idioms rather than introducing new patterns.
- **Validation:** add a Zod schema in `validations/` for any new request body and wire it through the `validate` middleware.
- **Data access:** keep SQL inside `models/` (Drizzle). Services call models, not the DB directly.
- **Google access:** never call `googleapis` directly for data — go through `corsair.withTenant(...)`.
- **Errors:** return honest errors; don't swallow failures. Wrap async route handlers with `asyncHandler`.
- **Comments:** explain _why_, not _what_; match the existing comment density.

**Husky + lint-staged** automatically format and lint staged files on commit — so commits stay clean by default.

---

## ✅ Quality Gates (Run Before You Push)

```bash
pnpm lint         # ESLint across all packages
pnpm type-check   # tsc --noEmit across all packages
pnpm test         # Vitest (API route + service tests)
pnpm build        # Build all apps & packages
pnpm format       # Prettier
```

**CI** (`.github/workflows/ci.yml`) runs lint → type-check → test → build on every push/PR to `main`, then builds the `api` and `web` Docker images. Your PR must pass all of these. Run them locally first to avoid round-trips.

Add or update **tests** for behavior you change — service and route tests live under `apps/api/src` (`__test__` directories).

---

## 🗃 Database Changes

Inboxly uses **Drizzle** with a generate-then-migrate workflow. Never hand-edit applied migrations.

```bash
# 1. Edit schema under apps/api/src/db/schema/
# 2. Generate a migration from the diff
pnpm --filter api db:generate

# 3. Apply it locally
pnpm --filter api db:migrate

# 4. Inspect with the GUI if helpful
pnpm --filter api db:studio
```

- Commit the generated SQL migration **alongside** your schema change.
- Corsair-owned tables (`corsair_*`) are managed by the SDK / `init.sql` — don't migrate those by hand.
- Call out any migration in your PR description so reviewers know to run `db:migrate`.

---

## 🔁 Pull Request Checklist

Before requesting review, confirm:

- [ ] Branch is focused on a single concern.
- [ ] `pnpm lint`, `pnpm type-check`, `pnpm test`, and `pnpm build` all pass locally.
- [ ] New/changed request shapes are reflected in `packages/shared` and validated with Zod.
- [ ] Tests added/updated for the behavior you changed.
- [ ] DB schema changes include a generated migration.
- [ ] No secrets committed; `.env` files remain gitignored.
- [ ] PR description explains **what** changed and **why**, with screenshots for UI changes.
- [ ] Commit messages follow Conventional Commits.

---

## 🐞 Reporting Bugs & Requesting Features

Open a **GitHub issue** and include:

- **Bugs:** steps to reproduce, expected vs. actual behavior, environment (OS, browser, Node version), and relevant logs/screenshots.
- **Features:** the problem you're solving and a sketch of the proposed approach — discussion before implementation saves everyone time.

---

## 🔐 Security Issues

**Do not** file security vulnerabilities as public issues. Follow the private disclosure process in [SECURITY.md](./SECURITY.md#-reporting-a-vulnerability).

---

<div align="center">

[**← README**](./README.md) &nbsp;·&nbsp; [**🏗 Architecture**](./ARCHITECTURE.md) &nbsp;·&nbsp; [**🔐 Security**](./SECURITY.md)

**Built with ☕ and a lot of tool-calls.** Thanks for contributing.

</div>
