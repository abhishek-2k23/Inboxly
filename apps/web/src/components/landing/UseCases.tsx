import { ArrowRight, Plus } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { USE_CASES } from "@/utils/landing-data";

export function UseCases() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div
        className="mesh-orb right-[-6%] top-1/3 h-72 w-72"
        style={{ background: "var(--mesh-3)" }}
      />

      <Container>
        <SectionHeading
          eyebrow="In practice"
          title="Just ask, in plain English"
          subtitle="Inboxly turns everyday requests into finished actions you can review and approve."
        />

        <Reveal className="mx-auto mt-12 max-w-3xl">
          <div className="card-premium divide-line divide-y overflow-hidden rounded-2xl">
            {USE_CASES.map((useCase) => (
              <div
                key={useCase.prompt}
                className="hover:bg-surface/40 grid grid-cols-1 gap-3 p-5 transition-colors sm:grid-cols-2 sm:items-center sm:gap-6"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-accent/10 text-accent grid h-7 w-7 shrink-0 place-items-center rounded-lg">
                    <Plus className="h-4 w-4" />
                  </span>
                  <p className="text-ink text-sm font-medium">{useCase.prompt}</p>
                </div>
                <div className="flex items-center gap-2.5 sm:justify-end">
                  <ArrowRight className="text-accent h-4 w-4 shrink-0" />
                  <p className="text-ink-2 text-sm">{useCase.result}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
