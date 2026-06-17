"use client";

import { useCallback, useRef, useState } from "react";
import { useToast } from "@/components/toast";
import { createPaymentOrder, verifyPayment } from "@/lib/api";
import { useSubscriptionStore } from "@/stores/subscription-store";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

interface CheckoutOptions {
  plan?: "pro";
  prefill?: { name?: string; email?: string };
  onSuccess?: () => void;
  onDismiss?: () => void;
}

export function useRazorpay() {
  const toast = useToast();
  const setSubscription = useSubscriptionStore((s) => s.set);
  const [loading, setLoading] = useState(false);
  const inProgress = useRef(false);

  const openCheckout = useCallback(
    async ({ plan = "pro", prefill, onSuccess, onDismiss }: CheckoutOptions = {}) => {
      if (inProgress.current) return;
      inProgress.current = true;
      setLoading(true);

      try {
        const scriptLoaded = await loadScript();
        if (!scriptLoaded) {
          toast.error("Failed to load payment gateway. Check your connection and try again.");
          return;
        }

        const order = await createPaymentOrder(plan);

        const options: RazorpayOptions = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "Inboxly",
          description: `Pro Plan — ₹${order.amount / 100}/month`,
          order_id: order.orderId,
          prefill,
          theme: { color: "#6366f1" },
          modal: {
            ondismiss: () => {
              onDismiss?.();
            },
          },
          handler: async (response) => {
            try {
              const updated = await verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              setSubscription(updated);
              toast.success("You're now on the Pro plan!");
              onSuccess?.();
            } catch {
              toast.error("Payment received but verification failed. Contact support.");
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch {
        toast.error("Could not initiate payment. Please try again.");
      } finally {
        setLoading(false);
        inProgress.current = false;
      }
    },
    [toast, setSubscription],
  );

  return { openCheckout, loading };
}
