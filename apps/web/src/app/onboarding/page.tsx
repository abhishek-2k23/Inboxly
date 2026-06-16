"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Calendar, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ConnectCard } from "@/components/onboarding/ConnectCard";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Spinner } from "@/components/ui/Spinner";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { useGoogleConnect } from "@/hooks/use-google-connect";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const { integrationsLoaded, gmailConnected, calendarConnected } = useAuth();
  const { connecting, error, connect } = useGoogleConnect();

  const bothConnected = gmailConnected && calendarConnected;

  // Guard: someone who is already fully set up shouldn't see onboarding. Only
  // checked once on initial load so connecting both here doesn't auto-skip the
  // "Go to Dashboard" step.
  const guarded = useRef(false);
  useEffect(() => {
    if (!integrationsLoaded || guarded.current) return;
    guarded.current = true;
    if (gmailConnected && calendarConnected) router.replace("/dashboard");
  }, [integrationsLoaded, gmailConnected, calendarConnected, router]);

  const firstName = user?.firstName?.trim();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        {!integrationsLoaded ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <Spinner className="text-accent h-6 w-6" />
            <p className="text-ink-2 text-sm">Loading your workspace…</p>
          </div>
        ) : (
          <div className="w-full max-w-lg">
            <div className="text-center">
              <h1 className="text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
                Welcome{firstName ? `, ${firstName}` : ""}
              </h1>
              <p className="text-ink-2 mt-3 text-pretty">
                Connect Gmail and Google Calendar to let Inboxly summarize, draft, and schedule for
                you. Both are required to continue.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <ConnectCard
                icon={Mail}
                title="Connect Gmail"
                description="Read, summarize, search, and reply to your email."
                connected={gmailConnected}
                connecting={connecting.gmail}
                error={error.gmail}
                onConnect={() => connect("gmail")}
              />
              <ConnectCard
                icon={Calendar}
                title="Connect Google Calendar"
                description="See your schedule and create events from a sentence."
                connected={calendarConnected}
                connecting={connecting.googlecalendar}
                error={error.googlecalendar}
                onConnect={() => connect("googlecalendar")}
              />
            </div>

            <div className="mt-8">
              <Button
                size="lg"
                className="w-full"
                disabled={!bothConnected}
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </Button>
              {!bothConnected && (
                <p className="text-ink-3 mt-3 text-center text-xs">
                  Connect both accounts to continue.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
