import cors from "cors";
import express from "express";
import { env } from "./env.js";
import { chatRouter } from "./routes/chat.js";
import { healthRouter } from "./routes/health.js";
import { itemsRouter } from "./routes/items.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin.split(",").map((origin) => origin.trim()),
    }),
  );
  app.use(express.json());

  app.use("/api/health", healthRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/items", itemsRouter);

  return app;
}
