import { Router } from "express";
import {
  getEmail,
  listEmails,
  searchEmails,
  streamEmails,
  syncEmails,
} from "../controllers/email.controller.js";
import { attachUser, requireAuthenticated } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { syncEmailsSchema } from "../validations/email.validation.js";

export const emailRouter = Router();

emailRouter.use(requireAuthenticated, attachUser);

emailRouter.get("/", listEmails);
emailRouter.get("/search", searchEmails);
emailRouter.get("/stream", streamEmails);
emailRouter.post("/sync", validate(syncEmailsSchema), syncEmails);
// Must come after the static routes above (/search, /stream) so they aren't
// swallowed as an ":id" match.
emailRouter.get("/:id", getEmail);
