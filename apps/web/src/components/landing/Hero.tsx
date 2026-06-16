import { Calendar, Check, Mail, Play, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Pill } from "@/components/ui/Pill";
import { Reveal } from "@/components/ui/Reveal";
import { ProductPreview } from "./ProductPreview";

const TRUST = [
  { icon: Mail, label: "Gmail Integration" },
  { icon: Calendar, label: "Google Calendar Integration" },
  { icon: Check, label: "No Credit Card Required" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="grid-backdrop pointer-events-none absolute inset-x-0 top-0 h-[560px]"
        aria-hidden
      />
      {/* soft mesh glow crowning the hero */}
      <div
        className="mesh-orb left-1/2 top-[-5rem] h-[440px] w-[680px] max-w-[92vw] -translate-x-1/2"
        style={{ background: "var(--mesh-1)" }}
      />

      <Container className="relative pb-10 pt-16 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Pill>
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Email &amp; Calendar Workspace
            </Pill>
          </Reveal>

          <Reveal delay={60}>
            <h1 className="text-ink mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
              Manage Email and Calendar from a{" "}
              <span className="from-accent to-accent-light bg-gradient-to-r bg-clip-text text-transparent">
                Single Workspace
              </span>
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="text-ink-2 mx-auto mt-5 max-w-xl text-pretty text-base sm:text-lg">
              Inboxly helps you summarize emails, draft replies, schedule meetings, and manage your
              day without switching between tools.
            </p>
          </Reveal>

          <Reveal delay={180}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/sign-up" size="lg" className="w-full sm:w-auto">
                Get Started Free
              </ButtonLink>
              <ButtonLink href="#demo" variant="ghost" size="lg" className="w-full sm:w-auto">
                <Play className="h-4 w-4" />
                Watch Demo
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={240}>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-2.5 text-sm">
              {TRUST.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="glass text-ink-2 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5"
                >
                  <Icon className="text-accent h-4 w-4" />
                  {label}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={120} className="relative mt-14 sm:mt-20">
          {/* glow pooled under the product mockup */}
          <div
            className="absolute inset-x-16 top-8 -z-10 h-48 blur-3xl"
            style={{ background: "var(--color-glow)" }}
            aria-hidden
          />
          <ProductPreview />
        </Reveal>
      </Container>
    </section>
  );
}
