import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

export function FinalCta() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
            Spend less time managing email
          </h2>
          <p className="text-ink-2 mt-3">Let Inboxly handle the busywork.</p>

          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              name="email"
              placeholder="Email address"
              className="bg-panel text-ink placeholder:text-ink-3 hairline focus:border-accent h-12 flex-1 rounded-[var(--radius-ctl)] px-4 text-sm focus:outline-none"
            />
            <ButtonLink href="/sign-up" size="lg" className="shrink-0">
              Get Started Free
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
