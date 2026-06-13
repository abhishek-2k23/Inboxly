import { Router } from "express";
import { listCalendarEvents, searchCalendarEvents, streamCalendarEvents, syncCalendar } from "../controllers/calendar.controller.js";
import { attachUser, requireAuthenticated } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { syncCalendarSchema } from "../validations/calendar.validation.js";

export const calendarRouter = Router();

calendarRouter.use(requireAuthenticated, attachUser);

calendarRouter.get("/", listCalendarEvents);
calendarRouter.get("/search", searchCalendarEvents);
calendarRouter.get("/stream", streamCalendarEvents);
calendarRouter.post("/sync", validate(syncCalendarSchema), syncCalendar);
