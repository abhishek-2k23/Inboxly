import { z } from "zod";

export const createItemSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
