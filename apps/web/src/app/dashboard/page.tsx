"use client";

import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/ui/Logo";
import { Spinner } from "@/components/ui/Spinner";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";

/** Placeholder shell — the full dashboard is the next phase. */
export default function DashboardPage() {
  const router = useRouter();
  const { integrationsLoaded, gmailConnected, calendarConnected } = useAuth();
  const ready = gmailConnected && calendarConnected;

  // Keep the "connect both accounts" requirement intact: anyone who reaches the
  // dashboard without finishing setup is sent back to onboarding.
  useEffect(() => {
    if (integrationsLoaded && !ready) router.replace("/onboarding");
  }, [integrationsLoaded, ready, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-line flex items-center justify-between border-b px-5 py-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 text-center">
        {!integrationsLoaded || !ready ? (
          <div className="flex flex-col items-center gap-4">
            <Spinner className="text-accent h-6 w-6" />
            <p className="text-ink-2 text-sm">Loading your workspace…</p>
          </div>
        ) : (
          <div>
            <h1 className="text-ink text-3xl font-semibold tracking-tight">You&apos;re all set</h1>
            <p className="text-ink-2 mt-3">Your dashboard is coming next.</p>
          </div>
        )}
      </main>
    </div>
  );
}
