import type { Request, Response } from "express";
import type { HealthResponse } from "@repo/shared";

export function getHealth(_req: Request, res: Response): void {
  const body: HealthResponse = { status: "ok", uptime: process.uptime() };
  res.json(body);
}
