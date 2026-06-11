import { Router } from "express";
import type { ApiError } from "@repo/shared";
import { pool } from "../db/pool.js";

export const itemsRouter = Router();

itemsRouter.get("/", async (_req, res) => {
  const result = await pool.query("SELECT id, name, created_at FROM items ORDER BY id DESC");
  res.json(result.rows);
});

itemsRouter.post("/", async (req, res) => {
  const { name } = req.body as { name?: string };

  if (!name) {
    const error: ApiError = { error: "name is required" };
    res.status(400).json(error);
    return;
  }

  const result = await pool.query(
    "INSERT INTO items (name) VALUES ($1) RETURNING id, name, created_at",
    [name],
  );
  res.status(201).json(result.rows[0]);
});
