import { SectionGlow } from "@/components/landing/section-glow";

const FEATURES = [
  {
    icon: "ti-robot",
    title: "AI Email Assistant",
    description: "Drafts replies and new emails in your voice, formatted and ready to send.",
  },
  {
    icon: "ti-calendar-plus",
    title: "Smart Scheduling",
    description: "Finds time, creates events, and adds Google Meet links from a single prompt.",
  },
  {
    icon: "ti-list-details",
    title: "Inbox Summaries",
    description: "Get a quick digest of unread mail without opening a single thread.",
  },
  {
    icon: "ti-flag",
    title: "Priority Detection",
    description: "Important messages are surfaced automatically so nothing slips through.",
  },
  {
    icon: "ti-search",
    title: "Lightning Search",
    description: "Semantic search across your emails and calendar finds what you mean.",
  },
  {
    icon: "ti-keyboard",
    title: "Keyboard-First Workflow",
    description: "Navigate, archive, and reply without ever reaching for the mouse.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative overflow-hidden px-6 py-16 sm:py-24">
      <SectionGlow variant="even" />
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-ink text-2xl font-medium tracking-tight sm:text-3xl">
          Built for how you actually work
        </h2>
        <p className="text-ink-2 mt-3 text-sm sm:text-base">
          Every feature is designed to remove a step — not add one.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="bg-panel hairline flex flex-col gap-3 rounded-[var(--radius-card)] p-6"
          >
            <span className="bg-accent-fill text-accent-light flex h-10 w-10 items-center justify-center rounded-[var(--radius-ctl)]">
              <i className={`ti ${feature.icon} text-xl`} aria-hidden />
            </span>
            <h3 className="text-ink text-base font-medium">{feature.title}</h3>
            <p className="text-ink-2 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
