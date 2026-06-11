import { Router } from "express";
import type { HealthResponse } from "@repo/shared";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  const body: HealthResponse = { status: "ok", uptime: process.uptime() };
  res.json(body);
});
