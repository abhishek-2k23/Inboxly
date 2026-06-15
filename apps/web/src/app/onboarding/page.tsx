"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { HeroBackground } from "@/components/landing/hero-background";
import { GoogleIcon } from "@/components/auth/auth-ui";
import { ThinkingDots } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { connectUrl } from "@/lib/api";
import { cn } from "@/lib/ui";
import type { GoogleIntegrationPlugin } from "@repo/shared";

type ProviderInfo = {
  id: GoogleIntegrationPlugin;
  name: string;
  icon: string;
  description: string;
};

const PROVIDERS: readonly [ProviderInfo, ProviderInfo] = [
  {
    id: "gmail",
    name: "Gmail",
    icon: "ti-mail",
    description: "Read, search, and send email on your behalf.",
  },
  {
    id: "googlecalendar",
    name: "Google Calendar",
    icon: "ti-calendar",
    description: "Read your events and schedule meetings for you.",
  },
];

const PROVIDER_NAME: Record<GoogleIntegrationPlugin, string> = {
  gmail: "Gmail",
  googlecalendar: "Google Calendar",
};

function isGooglePlugin(value: string | null): value is GoogleIntegrationPlugin {
  return value === "gmail" || value === "googlecalendar";
}

export default function Page() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden px-6 py-6">
      <HeroBackground />

      <Link href="/" className="relative z-10 flex items-center gap-2" aria-label="Inboxly home">
        <span className="bg-accent-fill text-accent-light flex h-8 w-8 items-center justify-center rounded-[var(--radius-ctl)]">
          <i className="ti ti-sparkles text-lg" aria-hidden />
        </span>
        <span className="text-ink text-base font-medium">Inboxly</span>
      </Link>

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
        <Suspense fallback={<LoadingState />}>
          <OnboardingContent />
        </Suspense>
      </div>
    </main>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const toast = useToast();
  const { gmailConnected, calendarConnected, integrationsLoaded, reloadIntegrations } = useAuth();
  const [connectingPlugin, setConnectingPlugin] = useState<GoogleIntegrationPlugin | null>(null);
  const pollers = useRef(new Map<GoogleIntegrationPlugin, ReturnType<typeof setInterval>>());

  const connected = searchParams.get("connected");
  const errorParam = searchParams.get("error");
  const bothConnected = gmailConnected && calendarConnected;

  useEffect(() => {
    void reloadIntegrations();
  }, [reloadIntegrations]);

  // If this page is rendered inside the OAuth popup landing on its result,
  // close it - the opener polls for closure and reloads status itself.
  useEffect(() => {
    if (connected || errorParam) window.close();
  }, [connected, errorParam]);

  useEffect(() => {
    const intervals = pollers.current;
    return () => {
      for (const interval of intervals.values()) clearInterval(interval);
      intervals.clear();
    };
  }, []);

  // Plain first visit (no OAuth round trip yet): show the full-page loader.
  // Returning from a connect/error redirect (popup blocked, fell back to a
  // full navigation) keeps the cards on screen and surfaces a per-card
  // "connecting" / "errored" state instead.
  if (!integrationsLoaded && !connected && !errorParam) return <LoadingState />;

  const erroredPlugin = isGooglePlugin(sessionStorage.getItem("connectingPlugin"))
    ? (sessionStorage.getItem("connectingPlugin") as GoogleIntegrationPlugin)
    : null;

  function handleConnect(plugin: GoogleIntegrationPlugin) {
    const width = 520;
    const height = 680;
    const left = Math.max(0, Math.round((window.screen.width - width) / 2));
    const top = Math.max(0, Math.round((window.screen.height - height) / 2));

    const popup = window.open(
      connectUrl(plugin),
      "inboxly-oauth",
      `width=${width},height=${height},left=${left},top=${top}`,
    );

    if (!popup) {
      // Popup blocked: fall back to a full-page navigation through the
      // existing OAuth round trip.
      sessionStorage.setItem("connectingPlugin", plugin);
      window.location.href = connectUrl(plugin);
      return;
    }

    setConnectingPlugin(plugin);

    const interval = setInterval(() => {
      if (!popup.closed) return;

      clearInterval(interval);
      pollers.current.delete(plugin);
      setConnectingPlugin(null);

      void reloadIntegrations().then(() => {
        const status = useAuthStore.getState().integrations?.[plugin];
        if (status === "connected") {
          toast.success(`${PROVIDER_NAME[plugin]} connected!`);
        } else {
          toast.error(`Couldn't connect ${PROVIDER_NAME[plugin]}. Please try again.`);
        }
      });
    }, 500);

    pollers.current.set(plugin, interval);
  }

  return (
    <div className="w-full max-w-2xl text-center">
      <h1 className="text-ink text-2xl font-semibold">
        Welcome{user?.firstName ? `, ${user.firstName}` : ""}!
      </h1>
      <p className="text-ink-2 mx-auto mt-2 max-w-md text-sm">
        Connect your Google account to unlock AI-powered email and calendar — Inboxly can then read,
        search, send, and schedule on your behalf.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PROVIDERS.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            connected={provider.id === "gmail" ? gmailConnected : calendarConnected}
            connecting={
              connectingPlugin === provider.id || (!integrationsLoaded && connected === provider.id)
            }
            errored={Boolean(errorParam) && erroredPlugin === provider.id}
            onConnect={() => handleConnect(provider.id)}
          />
        ))}
      </div>

      <StatusPanel
        gmailConnected={gmailConnected}
        calendarConnected={calendarConnected}
        connected={connected}
        errorParam={errorParam}
      />

      <button
        type="button"
        onClick={() => router.push("/app/inbox")}
        disabled={!bothConnected}
        className="bg-accent text-accent-ink hover:bg-accent-light mt-4 flex w-full items-center justify-center gap-2 rounded-[var(--radius-ctl)] px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue to dashboard
        <i className="ti ti-arrow-right" aria-hidden />
      </button>
    </div>
  );
}

function ProviderCard({
  provider,
  connected,
  connecting,
  errored,
  onConnect,
}: {
  provider: ProviderInfo;
  connected: boolean;
  connecting: boolean;
  errored: boolean;
  onConnect: () => void;
}) {
  return (
    <div className="bg-panel hairline flex flex-col items-center gap-3 rounded-[var(--radius-card)] p-6 text-center">
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full",
          connected ? "bg-accent-fill text-accent-light" : "bg-surface text-ink-2",
        )}
      >
        <i className={`ti ${provider.icon} text-2xl`} aria-hidden />
      </span>
      <div>
        <h2 className="text-ink text-sm font-medium">{provider.name}</h2>
        <p className="text-ink-2 mt-1 text-xs">{provider.description}</p>
      </div>

      {connected ? (
        <span className="text-accent-light flex items-center gap-1.5 text-sm font-medium">
          <i className="ti ti-circle-check" aria-hidden />
          Connected
        </span>
      ) : (
        <button
          type="button"
          onClick={onConnect}
          disabled={connecting}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-[var(--radius-ctl)] px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed",
            connecting
              ? "bg-surface text-ink-2 hairline"
              : errored
                ? "bg-surface text-prio-urgent hairline border-prio-urgent hover:bg-surface-hover"
                : "bg-accent text-accent-ink hover:bg-accent-light",
          )}
        >
          {connecting ? (
            <>
              <i className="ti ti-loader-2 animate-spin" aria-hidden />
              Connecting {provider.name}…
            </>
          ) : (
            <>
              <GoogleIcon />
              {errored ? "Try again" : `Connect ${provider.name}`}
            </>
          )}
        </button>
      )}
    </div>
  );
}

function StatusPanel({
  gmailConnected,
  calendarConnected,
  connected,
  errorParam,
}: {
  gmailConnected: boolean;
  calendarConnected: boolean;
  connected: string | null;
  errorParam: string | null;
}) {
  const connectedCount = (gmailConnected ? 1 : 0) + (calendarConnected ? 1 : 0);
  const bothConnected = connectedCount === 2;

  let message: string;
  if (errorParam) {
    message = "Something went wrong while connecting. Please try again.";
  } else if (bothConnected) {
    message = "All set! Continue to your inbox whenever you're ready.";
  } else if (isGooglePlugin(connected)) {
    const remaining = !gmailConnected ? "Gmail" : "Google Calendar";
    message = `${PROVIDER_NAME[connected]} connected. Now connect ${remaining} to finish setup.`;
  } else {
    const remaining = !gmailConnected ? "Gmail" : "Google Calendar";
    message = `Connect ${remaining} to finish setting up Inboxly.`;
  }

  return (
    <div className="bg-panel hairline mt-6 w-full rounded-[var(--radius-card)] p-5 text-left">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-2">Onboarding status</span>
        <span className="text-accent-light">{connectedCount} of 2 connected</span>
      </div>
      <div className="bg-surface mt-2.5 h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-accent h-full rounded-full transition-all"
          style={{ width: `${(connectedCount / PROVIDERS.length) * 100}%` }}
        />
      </div>
      <p className={cn("mt-3 text-sm", errorParam ? "text-prio-urgent" : "text-ink-2")}>
        {message}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="bg-panel hairline flex w-full max-w-sm flex-col items-center gap-2 rounded-[var(--radius-card)] p-8 text-center">
      <ThinkingDots label="Checking your connections…" />
    </div>
  );
}
