import { ArrowRight, Plus } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { USE_CASES } from "@/utils/landing-data";

export function UseCases() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="In practice"
          title="Just ask, in plain English"
          subtitle="Inboxly turns everyday requests into finished actions you can review and approve."
        />

        <div className="divide-line bg-panel hairline mx-auto mt-12 max-w-3xl divide-y overflow-hidden rounded-2xl">
          {USE_CASES.map((useCase, i) => (
            <Reveal key={useCase.prompt} delay={i * 80}>
              <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 sm:items-center sm:gap-6">
                <div className="flex items-center gap-3">
                  <span className="bg-surface text-ink-2 hairline grid h-7 w-7 shrink-0 place-items-center rounded-lg">
                    <Plus className="h-4 w-4" />
                  </span>
                  <p className="text-ink text-sm font-medium">{useCase.prompt}</p>
                </div>
                <div className="flex items-center gap-2.5 sm:justify-end">
                  <ArrowRight className="text-ink-3 h-4 w-4 shrink-0" />
                  <p className="text-ink-2 text-sm">{useCase.result}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
