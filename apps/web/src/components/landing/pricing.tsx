import Link from "next/link";
import { SectionGlow } from "@/components/landing/section-glow";
import { cn } from "@/lib/ui";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "For individuals getting started.",
    features: [
      "Gmail & Calendar sync",
      "AI drafts (limited)",
      "Daily inbox summaries",
      "1 connected account",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    description: "For people who live in their inbox.",
    features: [
      "Everything in Free",
      "Unlimited AI actions",
      "Smart scheduling + Meet links",
      "Priority detection & lightning search",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$10",
    period: "/user/month",
    description: "For collaborative workflows.",
    features: [
      "Everything in Pro",
      "Shared inboxes",
      "Team analytics",
      "Priority support & admin controls",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative overflow-hidden px-6 py-16 sm:py-24">
      <SectionGlow variant="odd" />
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-ink text-2xl font-medium tracking-tight sm:text-3xl">
          Simple pricing for every workflow
        </h2>
        <p className="text-ink-2 mt-3 text-sm sm:text-base">
          Start free. Upgrade when Inboxly becomes part of how you work.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "bg-panel flex flex-col gap-5 rounded-[var(--radius-card)] p-6",
              plan.highlighted ? "border-accent border-[0.5px]" : "hairline",
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-ink text-base font-medium">{plan.name}</h3>
              {plan.highlighted && (
                <span className="bg-accent-fill text-accent-light rounded-full px-2.5 py-1 text-xs font-medium">
                  Most Popular
                </span>
              )}
            </div>

            <div>
              <span className="text-ink text-3xl font-medium tracking-tight">{plan.price}</span>
              <span className="text-ink-2 text-sm">{plan.period}</span>
            </div>
            <p className="text-ink-2 text-sm">{plan.description}</p>

            <ul className="flex flex-col gap-2">
              {plan.features.map((feature) => (
                <li key={feature} className="text-ink-2 flex items-center gap-2 text-sm">
                  <i className="ti ti-check text-accent-light shrink-0" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href="/sign-up"
              className={cn(
                "mt-auto flex items-center justify-center rounded-[var(--radius-ctl)] px-4 py-2.5 text-sm font-medium transition-colors",
                plan.highlighted
                  ? "bg-accent text-accent-ink hover:bg-accent-light"
                  : "hairline text-ink hover:bg-surface-hover",
              )}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <a href="#pricing" className="text-accent-light text-sm font-medium hover:underline">
          View full pricing details
        </a>
      </div>
    </section>
  );
}
