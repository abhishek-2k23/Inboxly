import { ChatPanel } from "@/components/chat-panel";

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

      <ChatPanel />
    </main>
  );
}
