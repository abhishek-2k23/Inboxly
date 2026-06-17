import { clerkMiddleware } from "@clerk/express";
import * as Sentry from "@sentry/node";
import cors from "cors";
import express from "express";
import { env } from "./env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiRouter } from "./routes/index.js";
import { webhookRouter } from "./routes/webhook.route.js";

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

  app.use("/api", apiRouter);

  Sentry.setupExpressErrorHandler(app);

  app.use(errorHandler);

  return app;
}
