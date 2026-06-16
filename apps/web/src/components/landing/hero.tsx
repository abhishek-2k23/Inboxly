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
              Manage Email and Calendar from a Single Workspace
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
            <ul className="text-ink-2 mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              {TRUST.map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-2">
                  <Icon className="text-ink-3 h-4 w-4" />
                  {label}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={120} className="mt-14 sm:mt-20">
          <ProductPreview />
        </Reveal>
      </Container>
    </section>
  );
}
