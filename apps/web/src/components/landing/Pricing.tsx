import { ArrowRight, Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Pill } from "@/components/ui/Pill";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/ui";
import { PRICING } from "@/utils/landing-data";

export function Pricing() {
  return (
    <section
      id="pricing"
      className="border-line bg-surface/30 scroll-mt-20 border-y py-20 sm:py-28"
    >
      <Container>
        <SectionHeading
          eyebrow="Pricing"
          title="Simple, transparent pricing"
          subtitle="Start free. Upgrade when Inboxly becomes the way you run your day."
        />

        <div className="mt-12 grid items-start gap-5 lg:grid-cols-3">
          {PRICING.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 90}>
              <div
                className={cn(
                  "bg-panel relative flex h-full flex-col rounded-2xl p-6",
                  tier.popular
                    ? "border-accent border-2 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.4)]"
                    : "hairline",
                )}
              >
                {tier.popular && (
                  <Pill className="border-accent bg-accent text-accent-ink absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Pill>
                )}

                <h3 className="text-ink text-lg font-semibold">{tier.name}</h3>
                <p className="text-ink-2 mt-1 text-sm">{tier.description}</p>

                <p className="mt-5 flex items-baseline gap-1">
                  <span className="text-ink text-4xl font-semibold tracking-tight">
                    {tier.price}
                  </span>
                  <span className="text-ink-3 text-sm">{tier.period}</span>
                </p>

                <ButtonLink
                  href="/sign-up"
                  variant={tier.popular ? "primary" : "outline"}
                  size="md"
                  className="mt-6 w-full"
                >
                  {tier.cta}
                </ButtonLink>

                <ul className="mt-6 flex flex-col gap-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="text-ink-2 flex items-start gap-2.5 text-sm">
                      <Check className="text-ink mt-0.5 h-4 w-4 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8 text-center">
          <a
            href="#features"
            className="text-ink-2 hover:text-ink inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            Compare Plans
            <ArrowRight className="h-4 w-4" />
          </a>
        </Reveal>
      </Container>
    </section>
  );
}
