import { Avatar, PriorityDot } from "@/components/ui";
import { SectionGlow } from "@/components/landing/section-glow";

const EMAILS = [
  {
    name: "Design Team",
    subject: "Design review notes",
    snippet: "Updated mockups for the onboarding flow are ready for...",
    time: "2m",
    priority: "urgent" as const,
  },
  {
    name: "Rahul Sharma",
    subject: "Re: Sync tomorrow?",
    snippet: "Works for me — see you at 4 PM. I'll send the agenda...",
    time: "18m",
    priority: "medium" as const,
  },
  {
    name: "Linear",
    subject: "Your weekly digest",
    snippet: "3 issues closed, 2 in progress, 1 needs your input.",
    time: "1h",
    priority: "low" as const,
  },
];

const SCHEDULE = [
  { time: "10:00 AM", title: "Design review" },
  { time: "1:30 PM", title: "1:1 with Priya" },
  { time: "4:00 PM", title: "Sync with Rahul", highlight: true },
];

export function ProductPreview() {
  return (
    <section id="preview" className="relative overflow-hidden px-6 py-16 sm:py-24">
      <SectionGlow variant="odd" />
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-ink text-2xl font-medium tracking-tight sm:text-3xl">
          One workspace. Zero context switching.
        </h2>
        <p className="text-ink-2 mt-3 text-sm sm:text-base">
          Inboxly brings your inbox, calendar, and AI assistant into a single view — so you never
          have to jump between tabs to get things done.
        </p>
      </div>

      <div className="bg-panel hairline mx-auto mt-10 max-w-5xl overflow-hidden rounded-[var(--radius-card)]">
        {/* title bar */}
        <div className="hairline-b flex items-center gap-2 px-4 py-3">
          <span className="bg-accent-fill text-accent-light flex h-6 w-6 items-center justify-center rounded-[var(--radius-ctl)]">
            <i className="ti ti-sparkles text-sm" aria-hidden />
          </span>
          <span className="text-ink text-sm font-medium">Inboxly</span>
          <div className="text-ink-3 ml-auto flex items-center gap-2 text-xs">
            <span className="bg-accent-fill text-accent-light rounded-full px-2.5 py-1">Inbox</span>
            <span className="rounded-full px-2.5 py-1">Calendar</span>
          </div>
        </div>

        {/* main body */}
        <div className="hairline-b divide-line grid sm:grid-cols-[1.4fr_1fr] sm:divide-x">
          {/* inbox column */}
          <div className="flex flex-col">
            {EMAILS.map((email) => (
              <div
                key={email.subject}
                className="hairline-b flex items-start gap-3 px-4 py-3 last:border-b-0"
              >
                <Avatar name={email.name} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-ink truncate text-sm font-medium">{email.name}</span>
                    <span className="text-ink-3 shrink-0 text-xs">{email.time}</span>
                  </div>
                  <p className="text-ink truncate text-sm">{email.subject}</p>
                  <p className="text-ink-2 truncate text-xs">{email.snippet}</p>
                </div>
                <PriorityDot priority={email.priority} filled />
              </div>
            ))}
          </div>

          {/* calendar + AI action column */}
          <div className="flex flex-col gap-3 p-4">
            <div>
              <p className="text-ink-2 mb-2 text-xs font-medium uppercase tracking-wide">Today</p>
              <div className="flex flex-col gap-1.5">
                {SCHEDULE.map((item) => (
                  <div
                    key={item.title}
                    className={`flex items-center gap-2 rounded-[var(--radius-ctl)] px-2.5 py-1.5 text-sm ${
                      item.highlight ? "bg-accent-fill text-accent-light" : "bg-surface text-ink"
                    }`}
                  >
                    <span className="text-xs tabular-nums">{item.time}</span>
                    <span className="truncate">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface hairline mt-auto flex flex-col gap-2 rounded-[var(--radius-ctl)] p-3">
              <div className="flex items-center gap-2">
                <i className="ti ti-sparkles text-accent-light" aria-hidden />
                <span className="text-ink text-sm font-medium">AI action</span>
              </div>
              <div className="text-ink-2 flex items-center gap-2 text-xs">
                <i className="ti ti-circle-check text-accent-light" aria-hidden />
                Meeting created — tomorrow, 4:00 PM
              </div>
              <div className="text-ink-2 flex items-center gap-2 text-xs">
                <i className="ti ti-circle-check text-accent-light" aria-hidden />
                Google Meet link added
              </div>
            </div>
          </div>
        </div>

        {/* prompt bar */}
        <div className="bg-surface flex items-center gap-2 px-4 py-3">
          <i className="ti ti-sparkles text-accent-light text-lg" aria-hidden />
          <span className="text-ink-2 min-w-0 flex-1 truncate text-sm">
            Schedule a sync with Rahul tomorrow at 4 PM and add a Meet link
          </span>
          <span className="bg-accent text-accent-ink flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-ctl)]">
            <i className="ti ti-send text-sm" aria-hidden />
          </span>
        </div>
      </div>
    </section>
  );
}
