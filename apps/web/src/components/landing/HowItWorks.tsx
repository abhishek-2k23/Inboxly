import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { STEPS } from "@/utils/landing-data";

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="How Inboxly Works"
          subtitle="Three steps from a noisy inbox to a calm, managed day."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.number} delay={i * 90}>
              <article className="bg-panel hairline hover:border-line-strong h-full rounded-2xl p-6 transition-colors">
                <span className="text-ink-3 text-3xl font-semibold tracking-tight">
                  {step.number}.
                </span>
                <h3 className="text-ink mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="text-ink-2 mt-2 text-sm leading-relaxed">{step.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
