import { verifyWebhook } from "@clerk/express/webhooks";
import type { ApiError, MeResponse } from "@repo/shared";
import { env } from "../env.js";
import type { UserRecord } from "../models/user.model.js";
import { userService } from "../services/user.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function toMeResponse(user: UserRecord): MeResponse {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
  };
}

export const getMe = asyncHandler(async (req, res) => {
  res.json(toMeResponse(req.localUser!));
});

export const handleClerkWebhook = asyncHandler(async (req, res) => {
  let event;
  try {
    event = await verifyWebhook(req, { signingSecret: env.clerkWebhookSigningSecret });
  } catch (err) {
    console.error("Clerk webhook verification failed", err);
    const error: ApiError = { error: "Webhook verification failed" };
    res.status(400).json(error);
    return;
  }

  if (event.type === "user.created" || event.type === "user.updated" || event.type === "user.deleted") {
    await userService.syncFromWebhookEvent(event);
  }

  res.status(200).json({ received: true });
});
