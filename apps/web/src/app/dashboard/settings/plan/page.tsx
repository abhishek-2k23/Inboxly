"use client";

import {
  Check,
  CreditCard,
  MessageSquare,
  MessagesSquare,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { downgradeSubscription, upgradeSubscription } from "@/lib/api";
import { useSubscriptionStore } from "@/stores/subscription-store";

const PERKS = ["Unlimited AI chats", "Unlimited conversations", "Unlimited email syncs"];

function Meter({
  icon: Icon,
  label,
  used,
  limit,
  color,
}: {
  icon: LucideIcon;
  label: string;
  used: number;
  limit: number;
  color: string;
}) {
  const unlimited = limit < 0;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const atLimit = !unlimited && used >= limit;

  // Bar starts at 0 and animates to `pct` right after mount, instead of
  // snapping straight to its final width.
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <SpotlightCard className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-ink inline-flex items-center gap-2.5 text-sm font-medium">
          <span
            className="grid h-7 w-7 place-items-center rounded-lg"
            style={{ backgroundColor: `${color}1a`, color }}
          >
            <Icon className="h-4 w-4" />
          </span>
          {label}
        </span>
        <span className="text-ink text-base font-semibold tabular-nums">
          {used}
          {unlimited ? (
            <span className="text-ink-3 text-sm font-normal"> · Unlimited</span>
          ) : (
            <span className="text-ink-3 text-sm font-normal"> / {limit}</span>
          )}
        </span>
      </div>
      {!unlimited && (
        <div className="bg-surface mt-3 h-2 w-full overflow-hidden rounded-full">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ width: `${width}%`, backgroundColor: atLimit ? "var(--color-danger)" : color }}
          />
        </div>
      )}
    </SpotlightCard>
  );
}

/** Minimal card-token visual (chip + brand glyph) standing in for the saved payment method — no gradient, just tone. */
function CardPreview({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="bg-ink/[0.04] hairline relative grid h-10 w-14 shrink-0 place-items-center rounded-lg">
      <span className="bg-ink-3/35 absolute left-2 top-2 h-1.5 w-3 rounded-[2px]" />
      <Icon className="text-ink-2 h-5 w-5" />
    </div>
  );
}

export default function PlanPage() {
  const data = useSubscriptionStore((s) => s.data);
  const loaded = useSubscriptionStore((s) => s.loaded);
  const load = useSubscriptionStore((s) => s.load);
  const setSubscription = useSubscriptionStore((s) => s.set);
  const toast = useToast();

  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Brief "Activated" confirmation shown right after an upgrade succeeds.
  const [justUpgraded, setJustUpgraded] = useState(false);
  const upgradeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => () => clearTimeout(upgradeTimer.current ?? undefined), []);

  if (!loaded || !data) {
    return (
      <div className="grid place-items-center py-16">
        <Spinner className="text-accent h-6 w-6" />
      </div>
    );
  }

  const isPro = data.subscriptionType === "pro";

  async function handleUpgrade() {
    if (submitting) return;
    if (cardNumber.replace(/\D/g, "").length < 12) {
      toast.error("Enter a valid card number.");
      return;
    }
    setSubmitting(true);
    try {
      const next = await upgradeSubscription({ cardNumber, cardName: cardName || undefined });
      setSubscription(next);
      setCardNumber("");
      setCardName("");
      toast.success("You're on Pro — enjoy unlimited access!");
      setJustUpgraded(true);
      upgradeTimer.current = setTimeout(() => setJustUpgraded(false), 3200);
    } catch {
      toast.error("Payment failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDowngrade() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const next = await downgradeSubscription();
      setSubscription(next);
      toast.info("Switched back to the Free plan.");
    } catch {
      toast.error("Couldn't change your plan. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-rise-in space-y-6">
      {/* Current plan */}
      <SpotlightCard className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <span
            className="grid h-10 w-10 place-items-center rounded-xl"
            style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)" }}
          >
            <Sparkles className="text-accent h-5 w-5" />
          </span>
          <div>
            <p className="text-ink inline-flex items-center gap-2 text-sm font-semibold">
              {isPro ? "Pro plan" : "Free plan"}
              {justUpgraded && (
                <span className="text-success animate-scale-in inline-flex items-center gap-1 text-xs font-semibold">
                  <Check className="h-3.5 w-3.5" /> Activated
                </span>
              )}
            </p>
            <p className="text-ink-2 text-xs">
              {isPro
                ? "Unlimited chats, conversations & syncs."
                : "Includes a monthly free allowance."}
            </p>
          </div>
        </div>
        {isPro && (
          <span className="text-ink font-semibold">
            $12<span className="text-ink-3 text-sm font-normal">/mo</span>
          </span>
        )}
      </SpotlightCard>

      {/* Usage */}
      <div>
        <h3 className="text-ink text-sm font-semibold">Usage</h3>
        <div className="mt-3 space-y-3">
          <Meter
            icon={MessageSquare}
            label="Chats"
            used={data.usage.chats}
            limit={data.limits.chats}
            color="var(--color-accent)"
          />
          <Meter
            icon={MessagesSquare}
            label="In-depth conversations"
            used={data.usage.conversations}
            limit={data.limits.conversations}
            color="#8b7cff"
          />
          <Meter
            icon={RefreshCw}
            label="Email syncs"
            used={data.usage.emailSyncs}
            limit={data.limits.emailSyncs}
            color="#14b8a6"
          />
        </div>
      </div>

      {/* Upgrade / billing */}
      {isPro ? (
        <SpotlightCard className="p-5">
          <h3 className="text-ink text-sm font-semibold">Payment method</h3>
          <div className="mt-4 flex items-center gap-3">
            <CardPreview icon={CreditCard} />
            <div className="flex-1">
              <p className="text-ink text-sm font-medium">
                {data.payment.brand ?? "Card"} •••• {data.payment.last4 ?? "----"}
              </p>
              {data.payment.updatedAt && (
                <p className="text-ink-3 text-xs">
                  Active since {new Date(data.payment.updatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleDowngrade} disabled={submitting}>
              {submitting ? <Spinner className="h-3.5 w-3.5" /> : "Cancel plan"}
            </Button>
          </div>
        </SpotlightCard>
      ) : (
        <SpotlightCard className="p-5">
          <div className="flex items-center gap-2">
            <h3 className="text-ink text-sm font-semibold">Upgrade to Pro</h3>
            <span className="text-ink font-semibold">
              $12<span className="text-ink-3 text-xs font-normal">/mo</span>
            </span>
          </div>
          <ul className="mt-3 space-y-1.5">
            {PERKS.map((perk) => (
              <li key={perk} className="text-ink-2 flex items-center gap-2 text-sm">
                <Check className="text-accent h-4 w-4 shrink-0" />
                {perk}
              </li>
            ))}
          </ul>

          <div className="mt-5 space-y-3">
            <input
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="Card number"
              className="bg-surface text-ink placeholder:text-ink-3 hairline focus:border-accent focus:ring-accent/20 h-11 w-full rounded-[var(--radius-ctl)] px-3.5 text-sm outline-none transition-colors focus:ring-2"
            />
            <input
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Name on card"
              className="bg-surface text-ink placeholder:text-ink-3 hairline focus:border-accent focus:ring-accent/20 h-11 w-full rounded-[var(--radius-ctl)] px-3.5 text-sm outline-none transition-colors focus:ring-2"
            />
            <Button size="md" className="w-full" onClick={handleUpgrade} disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Processing…
                </>
              ) : (
                "Upgrade to Pro · $12/mo"
              )}
            </Button>
            <p className="text-ink-3 text-center text-xs">
              This is a demo checkout — no real charge is made.
            </p>
          </div>
        </SpotlightCard>
      )}
    </div>
  );
}
