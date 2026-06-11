import type { ErrorRequestHandler } from "express";
import type { ApiError } from "@repo/shared";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  const error: ApiError = { error: "Internal server error" };
  res.status(500).json(error);
};
