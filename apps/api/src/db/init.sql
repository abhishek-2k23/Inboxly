-- Runs automatically when the postgres container is created (docker-entrypoint-initdb.d).
-- Only one-time, privileged setup goes here (extensions). Tables/indexes/enums
-- are managed by Drizzle migrations in src/db/migrations (see package.json
-- "db:generate" / "db:migrate" scripts).

CREATE EXTENSION IF NOT EXISTS vector;
