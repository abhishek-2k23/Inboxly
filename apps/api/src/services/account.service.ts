import { clerkClient } from "@clerk/express";
import type { PlanLimits, SubscriptionResponse, SubscriptionType } from "@repo/shared";
import { paymentModel } from "../models/payment.model.js";
import { userModel, type UserRecord } from "../models/user.model.js";

/** Per-plan caps (-1 = unlimited). Server-authoritative. */
export const PLAN_LIMITS: Record<SubscriptionType, PlanLimits> = {
  // `chats` = how many new chats you can start; `chatDepth` = how many messages
  // a single chat can hold before the user must start a new one.
  free: { chats: 50, chatDepth: 5, emailSyncs: 100 },
  pro: { chats: -1, chatDepth: -1, emailSyncs: -1 },
};

/** Max size of a single email attachment, per plan. Server-authoritative. */
export const MAX_ATTACHMENT_BYTES: Record<SubscriptionType, number> = {
  free: 5 * 1024 * 1024, // 5 MB
  pro: 10 * 1024 * 1024, // 10 MB
};

/** Caps that bound the request body regardless of plan. */
export const MAX_ATTACHMENTS_PER_EMAIL = 5;
export const MAX_TOTAL_ATTACHMENT_BYTES = 25 * 1024 * 1024; // Gmail's own ceiling

const PLAN_PRICE_CENTS: Record<SubscriptionType, number> = { free: 0, pro: 1200 };

/** Thrown when a usage meter would exceed the plan's cap. */
export class PlanLimitError extends Error {
  constructor(public readonly metric: string) {
    super(`Plan limit reached for ${metric}`);
    this.name = "PlanLimitError";
  }
}

function atLimit(used: number, limit: number): boolean {
  return limit >= 0 && used >= limit;
}

function detectBrand(cardNumber: string): string {
  const n = cardNumber.replace(/\D/g, "");
  if (n.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^6/.test(n)) return "Discover";
  return "Card";
}

function toResponse(user: UserRecord): SubscriptionResponse {
  return {
    subscriptionType: user.subscriptionType,
    limits: PLAN_LIMITS[user.subscriptionType],
    usage: {
      chats: user.chatsUsed,
      emailSyncs: user.emailSyncsUsed,
    },
    payment: {
      brand: user.paymentBrand,
      last4: user.paymentLast4,
      updatedAt: user.subscriptionUpdatedAt,
    },
  };
}

export const accountService = {
  getSubscription(user: UserRecord): SubscriptionResponse {
    return toResponse(user);
  },

  async upgrade(user: UserRecord, cardNumber: string): Promise<SubscriptionResponse> {
    const digits = cardNumber.replace(/\D/g, "");
    const last4 = digits.slice(-4);
    const brand = detectBrand(digits);
    const updated = await userModel.setSubscription(user.id, {
      type: "pro",
      paymentBrand: brand,
      paymentLast4: last4,
    });
    await paymentModel.create(user.id, {
      plan: "pro",
      amountCents: PLAN_PRICE_CENTS.pro,
      cardBrand: brand,
      cardLast4: last4,
    });
    return toResponse(updated);
  },

  async upgradeWithRazorpay(
    user: UserRecord,
    opts: { paymentId: string; orderId: string },
  ): Promise<SubscriptionResponse> {
    const last4 = opts.paymentId.slice(-4);
    const updated = await userModel.setSubscription(user.id, {
      type: "pro",
      paymentBrand: "Razorpay",
      paymentLast4: last4,
    });
    await paymentModel.create(user.id, {
      plan: "pro",
      amountCents: PLAN_PRICE_CENTS.pro,
      cardBrand: "Razorpay",
      cardLast4: last4,
    });
    return toResponse(updated);
  },

  async downgrade(user: UserRecord): Promise<SubscriptionResponse> {
    const updated = await userModel.setSubscription(user.id, {
      type: "free",
      paymentBrand: null,
      paymentLast4: null,
    });
    return toResponse(updated);
  },

  /**
   * Counts usage for a chat turn. Only a brand-new chat consumes a "chats"
   * unit; follow-up messages within an existing chat are bounded by the
   * per-chat `chatDepth` cap (enforced in chatService.getCompletion), not by
   * this meter, so they don't increment anything here.
   */
  async consumeChat(user: UserRecord, newConversation: boolean): Promise<SubscriptionResponse> {
    if (!newConversation) return toResponse(user);
    const limits = PLAN_LIMITS[user.subscriptionType];
    if (atLimit(user.chatsUsed, limits.chats)) throw new PlanLimitError("chats");
    const updated = await userModel.incrementUsage(user.id, "chats");
    return toResponse(updated);
  },

  async consumeEmailSync(user: UserRecord): Promise<SubscriptionResponse> {
    const limits = PLAN_LIMITS[user.subscriptionType];
    if (atLimit(user.emailSyncsUsed, limits.emailSyncs)) throw new PlanLimitError("emailSyncs");
    const updated = await userModel.incrementUsage(user.id, "emailSyncs");
    return toResponse(updated);
  },

  async deleteAccount(user: UserRecord): Promise<void> {
    // Delete from our DB first, then remove the Clerk account so the user
    // cannot sign back in after deletion.
    await userModel.deleteByClerkId(user.clerkId);
    await clerkClient.users.deleteUser(user.clerkId);
  },
};
