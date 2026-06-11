import { getAuth } from "@clerk/express";
import type { RequestHandler } from "express";
import type { ApiError } from "@repo/shared";
import { userService } from "../services/user.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireAuthenticated: RequestHandler = (req, res, next) => {
  const { userId } = getAuth(req);

  if (!userId) {
    const error: ApiError = { error: "Unauthorized" };
    res.status(401).json(error);
    return;
  }

  next();
};

export const attachUser = asyncHandler(async (req, _res, next) => {
  const { userId } = getAuth(req);
  req.localUser = await userService.getOrCreateByClerkId(userId as string);
  next();
});
