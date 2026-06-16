import { Router } from "express";
import {
  archiveEmail,
  deleteDraft,
  getEmail,
  listArchivedEmails,
  listDrafts,
  listEmails,
  listSentEmails,
  searchEmails,
  sendDraft,
  sendEmail,
  streamEmails,
  syncEmails,
} from "../controllers/email.controller.js";
import { attachUser, requireAuthenticated } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { sendEmailSchema, syncEmailsSchema } from "../validations/email.validation.js";

export const emailRouter = Router();

emailRouter.use(requireAuthenticated, attachUser);

emailRouter.get("/", listEmails);
emailRouter.get("/search", searchEmails);
emailRouter.get("/stream", streamEmails);
emailRouter.get("/sent", listSentEmails);
emailRouter.get("/archived", listArchivedEmails);
emailRouter.get("/drafts", listDrafts);
emailRouter.post("/drafts/:draftId/send", sendDraft);
emailRouter.delete("/drafts/:draftId", deleteDraft);
emailRouter.post("/sync", validate(syncEmailsSchema), syncEmails);
emailRouter.post("/send", validate(sendEmailSchema), sendEmail);
emailRouter.post("/:id/archive", archiveEmail);
// Must come after the static routes above (/search, /stream, /sent,
// /archived, /drafts) so they aren't swallowed as an ":id" match.
emailRouter.get("/:id", getEmail);
