/**
 * Placeholder shown while Clerk's `<SignIn>` / `<SignUp>` widgets hydrate, so
 * the auth UI is persistent and doesn't flash empty space (or the previous
 * route) before the form appears. Sized to roughly match the Clerk card to
 * avoid layout shift when the real widget swaps in.
 */
export function AuthLoader() {
  return (
    <div className="bg-panel hairline flex w-[25rem] max-w-[90vw] flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] px-8 py-16">
      <i className="ti ti-loader-2 text-accent-light animate-spin text-2xl" aria-hidden />
      <p className="text-ink-2 text-sm">Loading…</p>
    </div>
  );
}
