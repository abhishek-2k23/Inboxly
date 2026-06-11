import { itemModel, type ItemRecord } from "../models/item.model.js";

export const itemService = {
  listForUser(userId: number): Promise<ItemRecord[]> {
    return itemModel.findAllByUser(userId);
  },

  create(userId: number, name: string): Promise<ItemRecord> {
    return itemModel.create(userId, name);
  },
};
