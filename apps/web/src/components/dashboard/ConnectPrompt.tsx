"use client";

import { Calendar, Mail, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { GoogleIntegrationPlugin } from "@repo/shared";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { useAuth } from "@/hooks/use-auth";
import { useGoogleConnect } from "@/hooks/use-google-connect";

export interface IntegrationMeta {
  icon: LucideIcon;
  /** Short label, e.g. "Gmail". */
  short: string;
  description: string;
  /** Solid brand-ish accent for the icon (used as a soft tint, no gradients). */
  color: string;
}

/** Shared per-plugin presentation, reused by ConnectPrompt and the Settings pages. */
export const INTEGRATION_META: Record<GoogleIntegrationPlugin, IntegrationMeta> = {
  gmail: {
    icon: Mail,
    short: "Gmail",
    description: "Read, summarize, search, and reply to your email with AI.",
    color: "#ea4335",
  },
  googlecalendar: {
    icon: Calendar,
    short: "Google Calendar",
    description: "See your schedule and create events from a sentence.",
    color: "#4f7cff",
  },
};

/** Soft tinted icon badge — solid color at low alpha, never a gradient. */
export function tintStyle(color: string) {
  return { backgroundColor: `${color}1a`, color };
}

function ConnectRow({
  plugin,
  connecting,
  error,
  onConnect,
}: {
  plugin: GoogleIntegrationPlugin;
  connecting: boolean;
  error: string | null;
  onConnect: () => void;
}) {
  const meta = INTEGRATION_META[plugin];
  const Icon = meta.icon;

  return (
    <SpotlightCard className="flex items-center gap-4 p-4">
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
        style={tintStyle(meta.color)}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-ink text-sm font-semibold">{meta.short}</p>
        <p className="text-ink-2 mt-0.5 text-xs">
          {error ? <span className="text-danger">{error}</span> : meta.description}
        </p>
      </div>
      <Button
        size="sm"
        variant={error ? "outline" : "primary"}
        onClick={onConnect}
        disabled={connecting}
        className="shrink-0"
      >
        {connecting ? (
          <>
            <Spinner className="h-3.5 w-3.5" />
            Connecting…
          </>
        ) : error ? (
          "Try again"
        ) : (
          "Connect"
        )}
      </Button>
    </SpotlightCard>
  );
}

/** Full-area prompt asking the user to connect the listed (missing) integrations. */
export function ConnectPrompt({ plugins }: { plugins: GoogleIntegrationPlugin[] }) {
  const { connecting, error, connect } = useGoogleConnect();

  const heading =
    plugins.length === 1
      ? `Connect ${INTEGRATION_META[plugins[0]!].short}`
      : "Connect your accounts";

  return (
    <div className="relative grid h-full place-items-center overflow-hidden p-6">
      <div
        className="mesh-orb left-1/2 top-1/4 h-80 w-80 -translate-x-1/2"
        style={{ background: "var(--mesh-1)" }}
      />

      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto flex w-fit items-center gap-3">
            {plugins.map((p) => {
              const meta = INTEGRATION_META[p];
              const Icon = meta.icon;
              return (
                <span
                  key={p}
                  className="grid h-14 w-14 place-items-center rounded-2xl"
                  style={tintStyle(meta.color)}
                >
                  <Icon className="h-7 w-7" />
                </span>
              );
            })}
          </div>

          <h2 className="text-ink mt-6 text-2xl font-semibold tracking-tight">{heading}</h2>
          <p className="text-ink-2 mt-2 text-pretty text-sm">
            Inboxly needs access to continue. Your data stays private — connect to pick up right
            where you left off.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {plugins.map((p) => (
            <ConnectRow
              key={p}
              plugin={p}
              connecting={connecting[p]}
              error={error[p]}
              onConnect={() => connect(p)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Renders `children` only when every required integration is connected;
 * otherwise shows a connect prompt for the missing ones. Shows a spinner until
 * integration status has loaded.
 */
export function IntegrationGate({
  requires,
  children,
}: {
  requires: GoogleIntegrationPlugin[];
  children: ReactNode;
}) {
  const { integrationsLoaded, gmailConnected, calendarConnected } = useAuth();

  if (!integrationsLoaded) {
    return (
      <div className="grid h-full place-items-center">
        <Spinner className="text-accent h-6 w-6" />
      </div>
    );
  }

  const connected: Record<GoogleIntegrationPlugin, boolean> = {
    gmail: gmailConnected,
    googlecalendar: calendarConnected,
  };
  const missing = requires.filter((p) => !connected[p]);

  if (missing.length === 0) return <>{children}</>;
  return <ConnectPrompt plugins={missing} />;
}
