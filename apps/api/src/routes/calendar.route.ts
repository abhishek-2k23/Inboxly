import { Router } from "express";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvent,
  listCalendarEvents,
  searchCalendarEvents,
  streamCalendarEvents,
  syncCalendar,
  updateCalendarEvent,
} from "../controllers/calendar.controller.js";
import { attachUser, requireAuthenticated } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createCalendarEventSchema,
  syncCalendarSchema,
} from "../validations/calendar.validation.js";

export const calendarRouter = Router();

calendarRouter.use(requireAuthenticated, attachUser);

calendarRouter.get("/", listCalendarEvents);
calendarRouter.get("/search", searchCalendarEvents);
calendarRouter.get("/stream", streamCalendarEvents);
calendarRouter.post("/sync", validate(syncCalendarSchema), syncCalendar);
calendarRouter.post("/", validate(createCalendarEventSchema), createCalendarEvent);
calendarRouter.get("/:id", getCalendarEvent);
calendarRouter.patch("/:id", updateCalendarEvent);
calendarRouter.delete("/:id", deleteCalendarEvent);
