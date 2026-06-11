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
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
