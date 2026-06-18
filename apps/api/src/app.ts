import { readFileSync } from "node:fs";
import { clerkMiddleware } from "@clerk/express";
import { apiReference } from "@scalar/express-api-reference";
import * as Sentry from "@sentry/node";
import cors from "cors";
import express from "express";
import { env } from "./env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiRouter } from "./routes/index.js";
import { webhookRouter } from "./routes/webhook.route.js";

// The OpenAPI spec lives at the api package root (../openapi.yaml relative to
// both src/ in dev and dist/ in prod), so this resolves in either case.
const openApiSpec = readFileSync(new URL("../openapi.yaml", import.meta.url), "utf8");

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin.split(",").map((origin) => origin.trim()),
      credentials: true,
    }),
  );

  // Clerk webhooks need the raw request body for signature verification,
  // so this is mounted before the global JSON body parser.
  app.use("/api/webhooks", webhookRouter);

  // Raised from the 100kb default so base64-encoded email attachments fit
  // (per-file cap is 10 MB; base64 inflates ~33%, and we allow up to 25 MB total).
  app.use(express.json({ limit: "35mb" }));
  app.use(clerkMiddleware());

  // Public, interactive API reference (Scalar) + the raw OpenAPI document.
  app.get("/api/openapi.yaml", (_req, res) => {
    res.type("application/yaml").send(openApiSpec);
  });
  app.use(
    "/api/docs",
    apiReference({
      content: openApiSpec,
      theme: "purple",
      metaData: { title: "Inboxly API Reference" },
    }),
  );

  app.use("/api", apiRouter);

  Sentry.setupExpressErrorHandler(app);

  app.use(errorHandler);

  return app;
}
