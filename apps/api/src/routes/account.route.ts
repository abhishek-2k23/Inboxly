import { Router } from "express";
import {
  consumeChatUsage,
  consumeEmailSyncUsage,
  deleteAccount,
  downgrade,
  getSubscription,
  upgrade,
} from "../controllers/account.controller.js";
import { attachUser, requireAuthenticated } from "../middleware/auth.js";

export const accountRouter = Router();

accountRouter.use(requireAuthenticated, attachUser);

accountRouter.get("/subscription", getSubscription);
accountRouter.post("/upgrade", upgrade);
accountRouter.post("/downgrade", downgrade);
accountRouter.post("/usage/chat", consumeChatUsage);
accountRouter.post("/usage/email-sync", consumeEmailSyncUsage);
accountRouter.delete("/", deleteAccount);
