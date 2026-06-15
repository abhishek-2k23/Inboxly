"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Chip, ThinkingDots } from "@/components/ui";
import { HeroBackground } from "@/components/landing/hero-background";

const EXAMPLE_PROMPTS = [
  "Schedule a meeting with Rahul tomorrow at 4 PM",
  "Summarize unread emails from today",
  "Draft a follow-up email to the design team",
  "Find free time next week",
];

const TRUST = [
  { icon: "ti-mail", label: "Gmail Integration" },
  { icon: "ti-calendar", label: "Calendar Integration" },
  { icon: "ti-credit-card-off", label: "No Credit Card Required" },
];

export function Hero() {
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const { isSignedIn } = useUser();
  const router = useRouter();

  function run(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed || thinking) return;
    setInput(trimmed);
    setThinking(true);
    window.setTimeout(() => {
      router.push(isSignedIn ? "/app/inbox" : "/sign-in");
    }, 600);
  }

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      <HeroBackground />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center">
        <span className="bg-surface text-ink-2 hairline mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs">
          <i className="ti ti-sparkles text-accent-light" aria-hidden />
          AI-Native Email &amp; Calendar Workspace
        </span>

        <h1 className="text-ink max-w-2xl text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
          Email &amp; calendar, run by a single prompt.
        </h1>

        <p className="text-ink-2 mt-4 max-w-xl text-base sm:text-lg">
          Inboxly drafts emails, schedules meetings, summarizes conversations, and manages your
          calendar using natural language.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className="bg-accent text-accent-ink hover:bg-accent-light flex items-center gap-2 rounded-[var(--radius-ctl)] px-5 py-2.5 text-sm font-medium transition-colors"
          >
            Get Started Free
            <i className="ti ti-arrow-right" aria-hidden />
          </Link>
          <a
            href="#preview"
            className="bg-panel text-ink hairline hover:bg-surface-hover flex items-center gap-2 rounded-[var(--radius-ctl)] px-5 py-2.5 text-sm font-medium transition-colors"
          >
            <i className="ti ti-player-play" aria-hidden />
            Watch Demo
          </a>
        </div>

        {/* prompt box — the main interactive entry point */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(input);
          }}
          className="glow-border bg-surface hairline focus-within:border-accent mt-8 flex w-full max-w-xl items-center gap-2 rounded-[var(--radius-card)] px-4 py-3 transition-colors"
        >
          <i className="ti ti-sparkles text-accent-light text-lg" aria-hidden />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell Inboxly what to do…"
            className="text-ink placeholder:text-ink-3 min-w-0 flex-1 bg-transparent text-sm outline-none sm:text-base"
          />
          <button
            type="submit"
            disabled={thinking}
            aria-label="Send"
            className="bg-accent text-accent-ink hover:bg-accent-light flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-ctl)] transition-colors disabled:opacity-50"
          >
            <i className="ti ti-send" aria-hidden />
          </button>
        </form>

        <div className="mt-3 flex max-w-xl flex-wrap justify-center gap-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <Chip key={prompt} onClick={() => run(prompt)}>
              <i className="ti ti-bolt text-accent-light" aria-hidden />
              {prompt}
            </Chip>
          ))}
        </div>

        {thinking && (
          <div className="mt-3">
            <ThinkingDots label="Opening Inboxly…" />
          </div>
        )}

        <div className="text-ink-2 mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
          {TRUST.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5">
              <i className={`ti ${item.icon} text-accent-light`} aria-hidden />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
