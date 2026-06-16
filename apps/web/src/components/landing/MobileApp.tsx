import { ArrowUp, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Pill } from "@/components/ui/Pill";
import { Reveal } from "@/components/ui/Reveal";

function PhoneMock() {
  return (
    <div className="relative mx-auto w-[260px]">
      <div className="bg-panel hairline rounded-[2.5rem] p-3 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.45)]">
        <div className="bg-bg hairline overflow-hidden rounded-[1.9rem]">
          <div className="text-ink-3 flex items-center justify-between px-5 pt-4 text-[11px] font-medium">
            <span>9:41</span>
            <span className="bg-line-strong h-1.5 w-16 rounded-full" />
          </div>
          <div className="px-4 pb-6 pt-4">
            <p className="text-ink text-sm font-semibold">Good morning, Abhishek</p>
            <p className="text-ink-3 mt-0.5 text-xs">You have 6 unread emails</p>

            <div className="bg-surface hairline mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5">
              <Sparkles className="text-ink-3 h-3.5 w-3.5" />
              <span className="text-ink-2 flex-1 text-xs">Summarize my inbox</span>
              <span className="bg-accent text-accent-ink grid h-6 w-6 place-items-center rounded-md">
                <ArrowUp className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {[
                { c: "3", t: "urgent", color: "var(--color-prio-urgent)" },
                { c: "2", t: "meetings", color: "var(--color-prio-low)" },
                { c: "1", t: "follow-up", color: "var(--color-prio-medium)" },
              ].map((row) => (
                <div
                  key={row.t}
                  className="bg-surface/60 hairline flex items-center gap-2.5 rounded-lg px-3 py-2"
                >
                  <span
                    className="grid h-5 w-5 place-items-center rounded text-[10px] font-semibold text-white"
                    style={{ backgroundColor: row.color }}
                  >
                    {row.c}
                  </span>
                  <span className="text-ink text-xs">{row.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileApp() {
  return (
    <section className="border-line bg-surface/30 border-y py-20 sm:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="order-2 lg:order-1">
            <PhoneMock />
          </Reveal>

          <Reveal delay={80} className="order-1 lg:order-2">
            <Pill>Coming Soon</Pill>
            <h2 className="text-ink mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              Inboxly Everywhere
            </h2>
            <p className="text-ink-2 mt-4 max-w-md">
              Manage email and calendar from desktop and mobile. Pick up exactly where you left off,
              with the same assistant in your pocket.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <span className="bg-accent text-accent-ink inline-flex h-12 items-center gap-2 rounded-xl px-5 text-sm font-medium">
                App Store
              </span>
              <span className="bg-accent text-accent-ink inline-flex h-12 items-center gap-2 rounded-xl px-5 text-sm font-medium">
                ▶ Google Play
              </span>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
