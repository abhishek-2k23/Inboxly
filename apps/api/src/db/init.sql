-- Runs automatically when the postgres container is created (docker-entrypoint-initdb.d).
-- Add your hackathon schema here.

CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
