import type { ApiError } from "@repo/shared";
import { z } from "zod";
import { accountService, PlanLimitError } from "../services/account.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getSubscription = asyncHandler(async (req, res) => {
  res.json(accountService.getSubscription(req.localUser!));
});

const upgradeSchema = z.object({
  cardNumber: z
    .string()
    .refine((v) => v.replace(/\D/g, "").length >= 12 && v.replace(/\D/g, "").length <= 19, {
      message: "Enter a valid card number",
    }),
  cardName: z.string().optional(),
});

export const upgrade = asyncHandler(async (req, res) => {
  const parsed = upgradeSchema.safeParse(req.body);
  if (!parsed.success) {
    const error: ApiError = { error: parsed.error.issues.map((i) => i.message).join(", ") };
    res.status(400).json(error);
    return;
  }
  const result = await accountService.upgrade(req.localUser!, parsed.data.cardNumber);
  res.json(result);
});

export const downgrade = asyncHandler(async (req, res) => {
  res.json(await accountService.downgrade(req.localUser!));
});

const chatUsageSchema = z.object({ newConversation: z.boolean().optional() });

export const consumeChatUsage = asyncHandler(async (req, res) => {
  const parsed = chatUsageSchema.safeParse(req.body ?? {});
  const newConversation = parsed.success ? Boolean(parsed.data.newConversation) : false;
  try {
    res.json(await accountService.consumeChat(req.localUser!, newConversation));
  } catch (err) {
    if (err instanceof PlanLimitError) {
      const error: ApiError = { error: `limit:${err.metric}` };
      res.status(402).json(error);
      return;
    }
    throw err;
  }
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await accountService.deleteAccount(req.localUser!);
  res.status(204).end();
});

export const consumeEmailSyncUsage = asyncHandler(async (req, res) => {
  try {
    res.json(await accountService.consumeEmailSync(req.localUser!));
  } catch (err) {
    if (err instanceof PlanLimitError) {
      const error: ApiError = { error: "limit:emailSyncs" };
      res.status(402).json(error);
      return;
    }
    throw err;
  }
});
