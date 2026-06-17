import type { ErrorRequestHandler } from "express";
import type { ApiError } from "@repo/shared";

// Corsair throws "[auth-missing:<plugin>] Authentication required..." when
// the user's OAuth credentials are absent or revoked. Return 401 so the
// frontend can prompt reconnection instead of showing a generic 500.
const AUTH_MISSING_RE = /^\[auth-missing:/;

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof Error && AUTH_MISSING_RE.test(err.message)) {
    const error: ApiError = { error: err.message };
    res.status(401).json(error);
    return;
  }
  console.error(err);
  const error: ApiError = { error: "Internal server error" };
  res.status(500).json(error);
};
