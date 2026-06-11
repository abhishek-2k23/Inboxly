import type { ItemRecord } from "../models/item.model.js";
import type { ItemResponse } from "@repo/shared";
import { itemService } from "../services/item.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { CreateItemInput } from "../validations/item.validation.js";

function toItemResponse(item: ItemRecord): ItemResponse {
  return { id: item.id, name: item.name, createdAt: item.createdAt };
}

export const listItems = asyncHandler(async (req, res) => {
  const items = await itemService.listForUser(req.localUser!.id);
  res.json(items.map(toItemResponse));
});

export const createItem = asyncHandler(async (req, res) => {
  const { name } = req.body as CreateItemInput;
  const item = await itemService.create(req.localUser!.id, name);
  res.status(201).json(toItemResponse(item));
});
