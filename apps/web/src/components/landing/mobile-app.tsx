import { SectionGlow } from "@/components/landing/section-glow";

const INBOX_PREVIEW = [
  { name: "Design Team", snippet: "Updated mockups are ready for review", time: "2m" },
  { name: "Rahul Sharma", snippet: "Works for me — see you at 4 PM", time: "18m" },
];

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function MobileApp() {
  return (
    <section className="relative overflow-hidden px-6 py-16 sm:py-24">
      <SectionGlow variant="odd" />
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        {/* copy */}
        <div className="order-2 lg:order-1">
          <span className="bg-accent-fill text-accent-light mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
            <i className="ti ti-clock" aria-hidden />
            Coming Soon
          </span>
          <h2 className="text-ink text-2xl font-medium tracking-tight sm:text-3xl">
            Inboxly Everywhere
          </h2>
          <p className="text-ink-2 mt-3 max-w-md text-sm sm:text-base">
            Manage your inbox and calendar seamlessly across desktop and mobile — the same
            prompt-first experience, wherever you are.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="bg-panel hairline text-ink flex items-center gap-2 rounded-[var(--radius-ctl)] px-4 py-2.5 text-sm font-medium opacity-70">
              <i className="ti ti-brand-apple text-lg" aria-hidden />
              Download on App Store
            </span>
            <span className="bg-panel hairline text-ink flex items-center gap-2 rounded-[var(--radius-ctl)] px-4 py-2.5 text-sm font-medium opacity-70">
              <i className="ti ti-brand-google-play text-lg" aria-hidden />
              Get it on Google Play
            </span>
          </div>
        </div>

        {/* phone mockup */}
        <div className="order-1 flex justify-center lg:order-2">
          <div className="bg-surface hairline w-64 rounded-[2rem] p-3">
            <div className="bg-page hairline flex flex-col gap-3 rounded-[1.5rem] p-3">
              {/* prompt bar */}
              <div className="bg-surface hairline flex items-center gap-2 rounded-[var(--radius-ctl)] px-3 py-2">
                <i className="ti ti-sparkles text-accent-light text-sm" aria-hidden />
                <span className="text-ink-3 text-xs">Ask Inboxly…</span>
              </div>

              {/* inbox preview */}
              <div className="flex flex-col gap-1.5">
                {INBOX_PREVIEW.map((email) => (
                  <div
                    key={email.name}
                    className="bg-surface flex items-center gap-2 rounded-[var(--radius-ctl)] px-3 py-2"
                  >
                    <span className="bg-accent-fill text-accent-light flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-medium">
                      {email.name[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-ink truncate text-xs font-medium">{email.name}</p>
                      <p className="text-ink-2 truncate text-[10px]">{email.snippet}</p>
                    </div>
                    <span className="text-ink-3 shrink-0 text-[10px]">{email.time}</span>
                  </div>
                ))}
              </div>

              {/* mini calendar */}
              <div className="hairline-t flex flex-col gap-2 pt-3">
                <div className="flex items-center justify-between">
                  {DAYS.map((day, i) => (
                    <span
                      key={`${day}-${i}`}
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${
                        i === 4 ? "bg-accent text-accent-ink font-medium" : "text-ink-2"
                      }`}
                    >
                      {day}
                    </span>
                  ))}
                </div>
                <div className="bg-accent-fill text-accent-light rounded-[var(--radius-ctl)] px-3 py-2 text-[10px] font-medium">
                  4:00 PM — Sync with Rahul
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
