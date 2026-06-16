import { ArrowUp, CalendarDays, Inbox, LayoutDashboard, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/ui";

const SIDEBAR = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Inbox, label: "Inbox" },
  { icon: CalendarDays, label: "Calendar" },
];

const SUMMARY = [
  { count: "3", label: "urgent emails", color: "var(--color-prio-urgent)" },
  { count: "2", label: "meeting requests", color: "var(--color-prio-low)" },
  { count: "1", label: "follow-up required", color: "var(--color-prio-medium)" },
];

const EVENTS = [
  { time: "9:30", title: "Product sync", tint: "var(--color-prio-low)" },
  { time: "11:00", title: "1:1 with Rahul", tint: "var(--color-prio-medium)" },
  { time: "15:00", title: "Design review", tint: "var(--color-prio-urgent)" },
];

/** The hero's centerpiece: a realistic, static Inboxly dashboard mockup. */
export function ProductPreview() {
  return (
    <div className="bg-panel hairline mx-auto max-w-5xl overflow-hidden rounded-2xl shadow-[0_24px_70px_-30px_rgba(0,0,0,0.35)]">
      {/* window chrome */}
      <div className="border-line bg-surface/60 flex items-center gap-2 border-b px-4 py-3">
        <span className="bg-line-strong h-3 w-3 rounded-full" />
        <span className="bg-line-strong h-3 w-3 rounded-full" />
        <span className="bg-line-strong h-3 w-3 rounded-full" />
        <div className="bg-bg text-ink-3 ml-3 hidden h-6 flex-1 items-center rounded-md px-3 text-xs sm:flex">
          app.inboxly.com
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[200px_1fr_270px]">
        {/* sidebar */}
        <aside className="border-line bg-surface/40 hidden flex-col justify-between border-r p-3 md:flex">
          <nav className="flex flex-col gap-1">
            {SIDEBAR.map(({ icon: Icon, label, active }) => (
              <span
                key={label}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm",
                  active ? "bg-panel text-ink hairline font-medium" : "text-ink-2",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </span>
            ))}
          </nav>
          <span className="text-ink-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm">
            <Settings className="h-4 w-4" />
            Settings
          </span>
        </aside>

        {/* main: prompt + summary */}
        <section className="border-line border-r p-5">
          <div className="bg-surface hairline flex items-center gap-2 rounded-xl px-3.5 py-3">
            <Sparkles className="text-ink-3 h-4 w-4 shrink-0" />
            <span className="text-ink-2 flex-1 text-sm">Summarize today&apos;s emails</span>
            <span className="bg-accent text-accent-ink grid h-7 w-7 place-items-center rounded-lg">
              <ArrowUp className="h-4 w-4" />
            </span>
          </div>

          <p className="text-ink-3 mt-6 text-xs font-medium uppercase tracking-wide">
            Today&apos;s Summary
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {SUMMARY.map((item) => (
              <li
                key={item.label}
                className="bg-surface/60 hairline flex items-center gap-3 rounded-xl px-3.5 py-3"
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-semibold text-white"
                  style={{ backgroundColor: item.color }}
                >
                  {item.count}
                </span>
                <span className="text-ink text-sm">
                  <span className="font-medium">{item.count}</span> {item.label}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* right rail: draft + calendar */}
        <aside className="hidden flex-col gap-4 p-4 lg:flex">
          <div className="bg-surface/50 hairline rounded-xl p-3.5">
            <p className="text-ink-3 text-xs font-medium uppercase tracking-wide">Draft</p>
            <p className="text-ink mt-2 text-sm font-medium">Re: Q3 partnership</p>
            <p className="text-ink-2 mt-1.5 text-xs leading-relaxed">
              Hey Jasmine — thanks for the thoughtful note. Tuesday at 3pm works perfectly on my
              end. I&apos;ll send over the deck beforehand so we can…
            </p>
            <div className="mt-3 flex gap-2">
              <span className="bg-accent text-accent-ink rounded-md px-2.5 py-1 text-xs font-medium">
                Send
              </span>
              <span className="bg-panel text-ink-2 hairline rounded-md px-2.5 py-1 text-xs">
                Edit
              </span>
            </div>
          </div>

          <div className="bg-surface/50 hairline rounded-xl p-3.5">
            <p className="text-ink-3 text-xs font-medium uppercase tracking-wide">Calendar</p>
            <ul className="mt-2.5 flex flex-col gap-2.5">
              {EVENTS.map((event) => (
                <li key={event.title} className="flex items-center gap-2.5">
                  <span className="h-8 w-1 rounded-full" style={{ backgroundColor: event.tint }} />
                  <div className="min-w-0">
                    <p className="text-ink truncate text-sm font-medium">{event.title}</p>
                    <p className="text-ink-3 text-xs">{event.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
