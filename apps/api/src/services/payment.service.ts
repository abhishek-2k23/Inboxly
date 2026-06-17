import crypto from "node:crypto";
import Razorpay from "razorpay";

const KEY_ID = process.env.RAZORPAY_KEY_ID ?? "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "";

// Lazily initialised so the server starts even without keys (shows clear error on first use).
let _razorpay: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!_razorpay) {
    if (!KEY_ID || !KEY_SECRET) {
      throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in the environment.");
    }
    _razorpay = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
  }
  return _razorpay;
}

/** Amount in paise (₹1 = 100 paise). */
const PLAN_AMOUNT: Record<string, number> = {
  pro: 30000, // ₹300
};

export const paymentService = {
  async createOrder(
    plan: "pro",
  ): Promise<{ orderId: string; amount: number; currency: string; keyId: string }> {
    const amount = PLAN_AMOUNT[plan];
    if (!amount) throw new Error(`Unknown plan: ${plan}`);

    const order = await getRazorpay().orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${plan}_${Date.now()}`,
    });

    return {
      orderId: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      keyId: KEY_ID,
    };
  },

  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    const expected = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    return expected === signature;
  },
};
