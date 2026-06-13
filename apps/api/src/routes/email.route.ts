import { Router } from "express";
import { listEmails, searchEmails, syncEmails } from "../controllers/email.controller.js";
import { attachUser, requireAuthenticated } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { syncEmailsSchema } from "../validations/email.validation.js";

export const emailRouter = Router();

emailRouter.use(requireAuthenticated, attachUser);

emailRouter.get("/", listEmails);
emailRouter.get("/search", searchEmails);
emailRouter.post("/sync", validate(syncEmailsSchema), syncEmails);
