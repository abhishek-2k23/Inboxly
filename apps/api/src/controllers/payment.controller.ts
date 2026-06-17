import type { ApiError, CreateOrderRequest, VerifyPaymentRequest } from "@repo/shared";
import { z } from "zod";
import { accountService } from "../services/account.service.js";
import { paymentService } from "../services/payment.service.js";
import { paymentModel } from "../models/payment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createOrderSchema = z.object({
  plan: z.enum(["pro"]),
});

export const createOrder = asyncHandler(async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    const error: ApiError = { error: parsed.error.issues.map((i) => i.message).join(", ") };
    res.status(400).json(error);
    return;
  }
  try {
    const order = await paymentService.createOrder(parsed.data.plan);
    res.json(order);
  } catch (err) {
    const error: ApiError = {
      error: err instanceof Error ? err.message : "Failed to create payment order",
    };
    res.status(500).json(error);
  }
});

const verifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    const error: ApiError = { error: parsed.error.issues.map((i) => i.message).join(", ") };
    res.status(400).json(error);
    return;
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const valid = paymentService.verifySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  );
  if (!valid) {
    const error: ApiError = { error: "Payment verification failed. Invalid signature." };
    res.status(400).json(error);
    return;
  }

  // Upgrade user to pro and record the payment.
  const user = req.localUser!;
  const updated = await accountService.upgradeWithRazorpay(user, {
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
  });
  res.json(updated);
});
