import { Router, json, raw } from "express";
import { handleClerkWebhook } from "../controllers/auth.controller.js";
import { handleCalendarWebhook } from "../controllers/calendar-webhook.controller.js";
import { handleGmailWebhook } from "../controllers/gmail-webhook.controller.js";

export const webhookRouter = Router();

// Clerk webhook signatures are verified against the raw request body.
webhookRouter.post("/clerk", raw({ type: "application/json" }), handleClerkWebhook);

// Gmail Pub/Sub push notifications - standard JSON body.
webhookRouter.post("/gmail", json(), handleGmailWebhook);

// Google Calendar push notifications (events.watch) - empty body, the
// channel/resource info comes in X-Goog-* headers.
webhookRouter.post("/calendar", json(), handleCalendarWebhook);
