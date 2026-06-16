import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { STEPS } from "@/utils/landing-data";

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div
        className="mesh-orb right-[-6%] top-12 h-72 w-72"
        style={{ background: "var(--mesh-1)" }}
      />

      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="How Inboxly Works"
          subtitle="Three steps from a noisy inbox to a calm, managed day."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.number} delay={i * 90}>
              <SpotlightCard className="group h-full p-6">
                <span className="from-accent to-accent-light bg-gradient-to-br bg-clip-text text-3xl font-semibold tracking-tight text-transparent">
                  {step.number}.
                </span>
                <h3 className="text-ink mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="text-ink-2 mt-2 text-sm leading-relaxed">{step.body}</p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
