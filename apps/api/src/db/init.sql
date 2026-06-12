-- Runs automatically when the postgres container is created (docker-entrypoint-initdb.d).
-- Only one-time, privileged setup goes here (extensions). Tables/indexes/enums
-- are managed by Drizzle migrations in src/db/migrations (see package.json
-- "db:generate" / "db:migrate" scripts).

CREATE EXTENSION IF NOT EXISTS vector;

-- Corsair's own tables (https://docs.corsair.dev/concepts/database) — created here
-- rather than via Drizzle since they're managed by the `corsair` SDK at runtime, not
-- our schema. `corsair_accounts` replaces our old `integration_connections`,
-- `corsair_entities` caches synced Gmail/Calendar data, and `corsair_events` replaces
-- our old `webhook_events`. `email_ai_meta.entity_id` (see src/db/schema/email.ts)
-- references `corsair_entities.id`.
CREATE TABLE IF NOT EXISTS corsair_integrations (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    dek TEXT NULL
);

CREATE TABLE IF NOT EXISTS corsair_accounts (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_id TEXT NOT NULL,
    integration_id TEXT NOT NULL REFERENCES corsair_integrations(id),
    config JSONB NOT NULL DEFAULT '{}',
    dek TEXT NULL
);

CREATE TABLE IF NOT EXISTS corsair_entities (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    account_id TEXT NOT NULL REFERENCES corsair_accounts(id),
    entity_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    version TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS corsair_events (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    account_id TEXT NOT NULL REFERENCES corsair_accounts(id),
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    status TEXT
);
