import { Router } from "express";
import { createItem, listItems } from "../controllers/item.controller.js";
import { attachUser, requireAuthenticated } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createItemSchema } from "../validations/item.validation.js";

export const itemRouter = Router();

itemRouter.use(requireAuthenticated, attachUser);

itemRouter.get("/", listItems);
itemRouter.post("/", validate(createItemSchema), createItem);
