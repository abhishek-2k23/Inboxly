import { clerkMiddleware } from "@clerk/express";
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

  app.use(express.json());
  app.use(clerkMiddleware());

  app.use("/api", apiRouter);

  app.use(errorHandler);

  return app;
}
