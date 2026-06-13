import { Show } from "@clerk/nextjs";
import Link from "next/link";
import { ChatPanel } from "@/components/chat-panel";
import { API_URL } from "@/lib/api";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-16">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          AI Hackathon Starter
        </h1>
        <p className="text-sm text-slate-400">
          Next.js + Tailwind frontend talking to an Express + Postgres + OpenAI
          backend.
        </p>
      </header>

      <Show when="signed-in">
        <section className="flex flex-col gap-2 text-sm">
          <p className="text-slate-400">Dev links (hit the API directly):</p>
          <div className="flex flex-wrap gap-3">
            <a className="underline" href={`${API_URL}/api/integrations/google/status`}>
              integration status
            </a>
            <a className="underline" href={`${API_URL}/api/integrations/google/connect/gmail`}>
              connect gmail
            </a>
            <a className="underline" href={`${API_URL}/api/integrations/google/connect/googlecalendar`}>
              connect calendar
            </a>
            <Link className="underline" href="/emails">
              email search
            </Link>
            <Link className="underline" href="/calendar">
              calendar search
            </Link>
          </div>
        </section>
      </Show>

      <ChatPanel />
    </main>
  );
}
