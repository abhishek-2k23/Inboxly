import { Router } from "express";
import { getMe } from "../controllers/auth.controller.js";
import { attachUser, requireAuthenticated } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.get("/me", requireAuthenticated, attachUser, getMe);
