import { Router, raw } from "express";
import { handleClerkWebhook } from "../controllers/auth.controller.js";

export const webhookRouter = Router();

// Clerk webhook signatures are verified against the raw request body.
webhookRouter.post("/clerk", raw({ type: "application/json" }), handleClerkWebhook);
