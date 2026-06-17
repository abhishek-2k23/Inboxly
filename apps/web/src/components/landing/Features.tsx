import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { FEATURES } from "@/utils/landing-data";

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-20 overflow-hidden py-20 sm:py-28">
      {/* seam blobs blend this section into the page mesh */}
      <div
        className="mesh-orb left-[-8%] top-16 h-72 w-72"
        style={{ background: "var(--mesh-2)" }}
      />
      <div
        className="mesh-orb bottom-10 right-[-6%] h-80 w-80"
        style={{ background: "var(--mesh-3)" }}
      />

      <Container>
        <SectionHeading
          eyebrow="Features"
          title="Everything you need, nothing you don't"
          subtitle="A focused set of tools that work together so your email and calendar finally feel like one workspace."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={(i % 3) * 80}>
              <SpotlightCard className="group h-full p-6">
                <span className="bg-accent/10 text-accent grid h-11 w-11 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-ink mt-4 text-base font-semibold">{title}</h3>
                <p className="text-ink-2 mt-2 text-sm leading-relaxed">{body}</p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
