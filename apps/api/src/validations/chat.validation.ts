import { z } from "zod";

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1, "messages must be a non-empty array"),
  timeZone: z.string().trim().min(1).optional(),
  conversationId: z.number().int().positive().optional(),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
