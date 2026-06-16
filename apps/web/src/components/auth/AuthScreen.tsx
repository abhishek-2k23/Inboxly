"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Spinner } from "@/components/ui/Spinner";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";

const GATE_URL = "/sign-in";

/**
 * Sign-in / sign-up screen. Renders Clerk's component inline (themed via the
 * provider's `clerkAppearance`) and doubles as the post-auth gate: once the
 * user is authenticated it shows a consistent branded loader while it resolves
 * integration status, then routes to /dashboard (both connected) or /onboarding
 * — never flashing another page in between.
 */
export function AuthScreen({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const {
    isLoaded,
    isSignedIn,
    integrationsLoaded,
    integrationsError,
    gmailConnected,
    calendarConnected,
    reloadIntegrations,
  } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !integrationsLoaded || integrationsError) return;
    router.replace(gmailConnected && calendarConnected ? "/dashboard" : "/onboarding");
  }, [
    isLoaded,
    isSignedIn,
    integrationsLoaded,
    integrationsError,
    gmailConnected,
    calendarConnected,
    router,
  ]);

  const showGate = !isLoaded || isSignedIn;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-16">
      <div className="grid-backdrop pointer-events-none absolute inset-0" aria-hidden />

      <div className="absolute left-5 top-5">
        <Logo />
      </div>
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <div className="relative flex w-full max-w-[25rem] justify-center">
        {showGate ? (
          <GateState error={integrationsError} onRetry={reloadIntegrations} />
        ) : mode === "sign-in" ? (
          <SignIn signUpUrl="/sign-up" fallbackRedirectUrl={GATE_URL} />
        ) : (
          <SignUp signInUrl="/sign-in" fallbackRedirectUrl={GATE_URL} />
        )}
      </div>
    </main>
  );
}

/** Shown while Clerk loads and during the post-auth status check. */
function GateState({ error, onRetry }: { error: boolean; onRetry: () => void }) {
  if (error) {
    return (
      <div className="bg-panel hairline flex flex-col items-center rounded-2xl p-8 text-center">
        <p className="text-ink text-sm font-medium">We couldn&apos;t load your workspace</p>
        <p className="text-ink-2 mt-1 text-sm">Check your connection and try again.</p>
        <Button variant="outline" size="md" className="mt-5" onClick={() => void onRetry()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <Spinner className="text-accent h-6 w-6" />
      <p className="text-ink-2 text-sm">Setting up your workspace…</p>
    </div>
  );
}
