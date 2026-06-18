"use client";

import { useUser } from "@clerk/nextjs";
import {
  Check,
  Loader2,
  MessageSquare,
  MessagesSquare,
  RefreshCw,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Reveal } from "@/components/ui/Reveal";
import { Spinner } from "@/components/ui/Spinner";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { useRazorpay } from "@/hooks/use-razorpay";
import { downgradeSubscription } from "@/lib/api";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { cn } from "@/lib/ui";
import { PRICING, type PricingTier } from "@/utils/landing-data";

/**
 * Maps a pricing tier card to the app's subscription type. The backend only
 * models `free` / `pro`; "Team" is an aspirational upsell tier shown here but
 * not yet sellable (see the coming-soon toast).
 */
function tierKey(tier: PricingTier): "free" | "pro" | "team" {
  const name = tier.name.toLowerCase();
  if (name === "free") return "free";
  if (name === "pro") return "pro";
  return "team";
}

export default function BillingPage() {
  const { user } = useUser();
  const data = useSubscriptionStore((s) => s.data);
  const loaded = useSubscriptionStore((s) => s.loaded);
  const load = useSubscriptionStore((s) => s.load);
  const setSubscription = useSubscriptionStore((s) => s.set);
  const toast = useToast();
  const { openCheckout, loading: checkoutLoading } = useRazorpay();
  const [downgrading, setDowngrading] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  const currentPlan = data?.subscriptionType ?? "free";
  const isPro = currentPlan === "pro";

  function handlePlanCta(tier: PricingTier) {
    const key = tier.name.toLowerCase();

    if (key === "team") {
      toast.info("Team plan is coming soon — stay tuned!");
      return;
    }

    if (key === "free" && isPro) {
      void handleDowngrade();
      return;
    }

    if (key === "pro" && !isPro) {
      openCheckout({
        plan: "pro",
        prefill: {
          name: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || undefined,
          email: user?.primaryEmailAddress?.emailAddress,
        },
      });
    }
  }

  async function handleDowngrade() {
    setDowngrading(true);
    try {
      const updated = await downgradeSubscription();
      setSubscription(updated);
      toast.success("Downgraded to Free plan.");
    } catch {
      toast.error("Couldn't downgrade. Please try again.");
    } finally {
      setDowngrading(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <header className="animate-rise-in">
          <h1 className="text-ink text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="text-ink-2 mt-1.5 text-sm">Manage your plan and review your usage.</p>
        </header>

        {!loaded || !data ? (
          <div className="grid place-items-center py-24">
            <Spinner className="text-accent h-6 w-6" />
          </div>
        ) : (
          <div className="mt-8 space-y-12">
            {/* 1 — Current subscription hero */}
            <CurrentSubscription isPro={isPro} />

            {/* 2 — Plan cards */}
            <section>
              <div className="animate-rise-in">
                <h2 className="text-ink text-base font-semibold">Plans</h2>
                <p className="text-ink-2 mt-1 text-sm">
                  Pick the plan that fits how you work. Change anytime.
                </p>
              </div>

              <div className="mt-6 grid items-start gap-5 lg:grid-cols-3">
                {PRICING.map((tier, i) => {
                  const key = tierKey(tier);
                  const isCurrent = key === currentPlan;
                  // Only show loading on the specific card being acted on.
                  const isLoadingThisCard =
                    (key === "pro" && checkoutLoading) || (key === "free" && downgrading);
                  const anyBusy = checkoutLoading || downgrading;
                  return (
                    <Reveal key={tier.name} delay={i * 90}>
                      <SpotlightCard
                        className={cn(
                          "flex h-full flex-col p-6",
                          tier.popular && "ring-accent/60 ring-1 lg:scale-[1.03]",
                        )}
                      >
                        {isCurrent ? (
                          <Pill className="border-accent bg-accent text-accent-ink absolute -top-3 left-1/2 -translate-x-1/2">
                            <Check className="h-3 w-3" /> Current plan
                          </Pill>
                        ) : (
                          tier.popular && (
                            <Pill className="border-accent bg-accent text-accent-ink absolute -top-3 left-1/2 -translate-x-1/2">
                              <Sparkles className="h-3 w-3" /> Most popular
                            </Pill>
                          )
                        )}

                        <h3 className="text-ink text-lg font-semibold">{tier.name}</h3>
                        <p className="text-ink-2 mt-1 text-sm">{tier.description}</p>

                        <p className="mt-5 flex items-baseline gap-1">
                          <span className="text-ink text-4xl font-semibold tracking-tight">
                            {tier.price}
                          </span>
                          <span className="text-ink-3 text-sm">{tier.period}</span>
                        </p>

                        <Button
                          variant={tier.popular && !isCurrent ? "primary" : "outline"}
                          size="md"
                          className="mt-6 w-full"
                          disabled={isCurrent || anyBusy}
                          onClick={() => handlePlanCta(tier)}
                        >
                          {isLoadingThisCard && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                          {isCurrent
                            ? "Current plan"
                            : key === "free" && isPro
                              ? "Downgrade to Free"
                              : key === "team"
                                ? "Coming Soon"
                                : tier.cta}
                        </Button>

                        <ul className="mt-6 flex flex-col gap-3">
                          {tier.features.map((feature) => (
                            <li
                              key={feature}
                              className="text-ink-2 flex items-start gap-2.5 text-sm"
                            >
                              <span className="bg-accent/10 text-accent mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full">
                                <Check className="h-3 w-3" />
                              </span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </SpotlightCard>
                    </Reveal>
                  );
                })}
              </div>
            </section>

            {/* 3 — Usage & limits */}
            <section>
              <div className="animate-rise-in">
                <h2 className="text-ink text-base font-semibold">Usage &amp; limits</h2>
                <p className="text-ink-2 mt-1 text-sm">
                  Your activity against this month&apos;s allowance.
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Meter
                  icon={MessageSquare}
                  label="Chats"
                  used={data.usage.chats}
                  limit={data.limits.chats}
                />
                <CapCard
                  icon={MessagesSquare}
                  label="Chat depth"
                  limit={data.limits.chatDepth}
                  unit="messages / chat"
                />
                <Meter
                  icon={RefreshCw}
                  label="Email syncs"
                  used={data.usage.emailSyncs}
                  limit={data.limits.emailSyncs}
                />
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------- Current subscription --------------------------- */

function CurrentSubscription({ isPro }: { isPro: boolean }) {
  return (
    <SpotlightCard className="animate-rise-in relative p-6">
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="bg-accent/10 text-accent grid h-12 w-12 place-items-center rounded-2xl">
            <Sparkles className="h-6 w-6" />
          </span>
          <div>
            <p className="text-ink-3 text-xs font-medium uppercase tracking-[0.08em]">
              Current subscription
            </p>
            <p className="text-ink mt-0.5 text-xl font-semibold">{isPro ? "Pro" : "Free"} plan</p>
            <p className="text-ink-2 mt-0.5 text-sm">
              {isPro ? "Unlimited chats, depth & syncs." : "Includes a monthly free allowance."}
            </p>
          </div>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-ink text-2xl font-semibold tracking-tight">
            {isPro ? "₹300" : "₹0"}
            <span className="text-ink-3 text-sm font-normal">/mo</span>
          </p>
          <span
            className={cn(
              "mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              isPro ? "bg-accent text-accent-ink" : "bg-surface text-ink-2 hairline",
            )}
          >
            {isPro && <Sparkles className="h-3 w-3" />}
            {isPro ? "Active" : "Free tier"}
          </span>
        </div>
      </div>
    </SpotlightCard>
  );
}

/* --------------------------------- CapCard --------------------------------- */

/**
 * A flat limit (not a running total) - e.g. how many messages a single chat
 * can hold. Shows the cap itself rather than a usage bar.
 */
function CapCard({
  icon: Icon,
  label,
  limit,
  unit,
}: {
  icon: LucideIcon;
  label: string;
  limit: number;
  unit: string;
}) {
  const unlimited = limit < 0;
  return (
    <SpotlightCard className="p-4">
      <div className="flex items-center gap-2.5">
        <span className="bg-accent/10 text-accent grid h-7 w-7 place-items-center rounded-lg">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-ink text-sm font-medium">{label}</span>
      </div>

      <p className="text-ink mt-3 text-2xl font-semibold tabular-nums">
        {unlimited ? (
          <span className="text-ink-3 text-base font-normal">Unlimited</span>
        ) : (
          <>
            {limit}
            <span className="text-ink-3 text-sm font-normal"> {unit}</span>
          </>
        )}
      </p>
    </SpotlightCard>
  );
}

/* --------------------------------- Meter --------------------------------- */

function Meter({
  icon: Icon,
  label,
  used,
  limit,
}: {
  icon: LucideIcon;
  label: string;
  used: number;
  limit: number;
}) {
  const unlimited = limit < 0;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const atLimit = !unlimited && used >= limit;

  // Bar animates from 0 to its final width just after mount.
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(unlimited ? 100 : pct));
    return () => cancelAnimationFrame(id);
  }, [pct, unlimited]);

  return (
    <SpotlightCard className="p-4">
      <div className="flex items-center gap-2.5">
        <span className="bg-accent/10 text-accent grid h-7 w-7 place-items-center rounded-lg">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-ink text-sm font-medium">{label}</span>
      </div>

      <p className="text-ink mt-3 text-2xl font-semibold tabular-nums">
        {used}
        {unlimited ? (
          <span className="text-ink-3 text-sm font-normal"> · Unlimited</span>
        ) : (
          <span className="text-ink-3 text-sm font-normal"> / {limit}</span>
        )}
      </p>

      {/* Flat accent fill (or danger when maxed) — no gradient. */}
      <div className="bg-surface mt-3 h-2 w-full overflow-hidden rounded-full">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            width: `${width}%`,
            backgroundColor: atLimit ? "var(--color-danger)" : "var(--color-accent)",
          }}
        />
      </div>
    </SpotlightCard>
  );
}
