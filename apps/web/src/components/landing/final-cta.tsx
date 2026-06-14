import { SectionGlow } from "@/components/landing/section-glow";

export function FinalCta() {
  return (
    <section className="hairline-t bg-surface-2 relative overflow-hidden px-6 py-16 sm:py-24">
      <SectionGlow variant="even" />
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <h2 className="text-ink text-3xl font-medium tracking-tight sm:text-4xl">
          Spend Less Time Managing Email.
        </h2>
        <p className="text-ink-2 mt-3 text-sm sm:text-base">
          Let AI handle the busywork so you can focus on what matters.
        </p>

        <form
          action="/sign-up"
          method="get"
          className="bg-panel hairline mt-8 flex w-full max-w-md flex-col gap-2 rounded-[var(--radius-card)] p-2 sm:flex-row"
        >
          <input
            type="email"
            name="email"
            required
            placeholder="you@company.com"
            className="text-ink placeholder:text-ink-3 min-w-0 flex-1 rounded-[var(--radius-ctl)] bg-transparent px-3 py-2.5 text-sm outline-none"
          />
          <button
            type="submit"
            className="bg-accent text-accent-ink hover:bg-accent-light flex items-center justify-center gap-2 rounded-[var(--radius-ctl)] px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Get Started
            <i className="ti ti-arrow-right" aria-hidden />
          </button>
        </form>
      </div>
    </section>
  );
}
