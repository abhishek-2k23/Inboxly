import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FEATURES } from "@/utils/landing-data";

export function Features() {
  return (
    <section
      id="features"
      className="border-line bg-surface/30 scroll-mt-20 border-y py-20 sm:py-28"
    >
      <Container>
        <SectionHeading
          eyebrow="Features"
          title="Everything you need, nothing you don't"
          subtitle="A focused set of tools that work together so your email and calendar finally feel like one workspace."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={(i % 3) * 80}>
              <article className="bg-panel hairline hover:border-line-strong group h-full rounded-2xl p-6 transition-colors">
                <span className="bg-surface text-ink-2 group-hover:text-ink hairline grid h-10 w-10 place-items-center rounded-xl transition-colors">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-ink mt-4 text-base font-semibold">{title}</h3>
                <p className="text-ink-2 mt-2 text-sm leading-relaxed">{body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
