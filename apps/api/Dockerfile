# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# ---- Install dependencies -------------------------------------------------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
RUN pnpm install --frozen-lockfile

# ---- Build ------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app /app
COPY . .
RUN pnpm turbo run build --filter=api...
RUN pnpm deploy --filter=api --prod /app/out

# ---- Run ----------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 expressjs
WORKDIR /app

COPY --from=builder --chown=expressjs:nodejs /app/out/dist ./dist
COPY --from=builder --chown=expressjs:nodejs /app/out/node_modules ./node_modules
COPY --from=builder --chown=expressjs:nodejs /app/out/package.json ./package.json
COPY --from=builder --chown=expressjs:nodejs /app/apps/api/src/db/init.sql ./src/db/init.sql
# Served by the Scalar API reference at /api/docs (read at startup, ../openapi.yaml from dist/).
COPY --from=builder --chown=expressjs:nodejs /app/apps/api/openapi.yaml ./openapi.yaml

USER expressjs
EXPOSE 4000
CMD ["node", "dist/index.js"]
