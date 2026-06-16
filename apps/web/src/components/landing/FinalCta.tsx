import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div
        className="mesh-orb left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2"
        style={{ background: "var(--mesh-1)" }}
      />

      <Container>
        <Reveal>
          <div className="card-premium mx-auto max-w-2xl rounded-3xl px-6 py-12 text-center sm:px-12">
            <h2 className="text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
              Spend less time managing email
            </h2>
            <p className="text-ink-2 mt-3">Let Inboxly handle the busywork.</p>

            <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
              <input
                type="email"
                name="email"
                placeholder="Email address"
                className="bg-surface text-ink placeholder:text-ink-3 hairline focus:border-accent h-12 flex-1 rounded-[var(--radius-ctl)] px-4 text-sm transition-colors focus:outline-none"
              />
              <ButtonLink href="/sign-up" size="lg" className="shrink-0">
                Get Started Free
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
