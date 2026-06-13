import { Router } from "express";
import { postChat } from "../controllers/chat.controller.js";
import { attachUser, requireAuthenticated } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { chatRequestSchema } from "../validations/chat.validation.js";

export const chatRouter = Router();

chatRouter.post("/", requireAuthenticated, attachUser, validate(chatRequestSchema), postChat);
