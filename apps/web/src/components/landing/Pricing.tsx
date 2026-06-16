import { ArrowRight, Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Pill } from "@/components/ui/Pill";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { cn } from "@/lib/ui";
import { PRICING } from "@/utils/landing-data";

export function Pricing() {
  return (
    <section id="pricing" className="relative scroll-mt-20 overflow-hidden py-20 sm:py-28">
      <div
        className="mesh-orb left-1/2 top-0 h-80 w-80 -translate-x-1/2"
        style={{ background: "var(--mesh-1)" }}
      />

      <Container>
        <SectionHeading
          eyebrow="Pricing"
          title="Simple, transparent pricing"
          subtitle="Start free. Upgrade when Inboxly becomes the way you run your day."
        />

        <div className="mt-12 grid items-start gap-5 lg:grid-cols-3">
          {PRICING.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 90}>
              <SpotlightCard
                className={cn(
                  "flex h-full flex-col p-6",
                  tier.popular && "gradient-border lg:scale-[1.03]",
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
                      <span className="bg-accent/10 text-accent mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full">
                        <Check className="h-3 w-3" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
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
