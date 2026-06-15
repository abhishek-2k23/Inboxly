"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { GoogleIntegrationPlugin } from "@repo/shared";
import { connectUrl } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useToast } from "@/components/toast";
import { GoogleIcon } from "@/components/auth/auth-ui";

interface PluginConfig {
  icon: string;
  name: string;
  title: string;
  description: string;
  features: string[];
}

const CONFIG: Record<GoogleIntegrationPlugin, PluginConfig> = {
  gmail: {
    icon: "ti-mail",
    name: "Gmail",
    title: "Connect your Gmail",
    description:
      "Inboxly needs access to your Gmail to read, search, and send email on your behalf.",
    features: [
      "AI-powered semantic search across all emails",
      "Smart priority inbox with auto-categorisation",
      "Send and reply from the prompt bar",
    ],
  },
  googlecalendar: {
    icon: "ti-calendar",
    name: "Google Calendar",
    title: "Connect your Google Calendar",
    description: "Inboxly needs access to your calendar to view events and schedule meetings.",
    features: [
      "See all your events in month, week, and day views",
      "Create and edit events from the prompt bar",
      "Block focus time and invite attendees with AI",
    ],
  },
};

export function NotConnected({ plugin }: { plugin: GoogleIntegrationPlugin }) {
  const config = CONFIG[plugin];
  const [connecting, setConnecting] = useState(false);
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadIntegrations = useAuthStore((s) => s.loadIntegrations);
  const toast = useToast();

  useEffect(() => {
    return () => {
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, []);

  function handleConnect() {
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
      window.location.href = connectUrl(plugin);
      return;
    }

    setConnecting(true);

    pollerRef.current = setInterval(() => {
      if (!popup.closed) return;
      if (pollerRef.current) clearInterval(pollerRef.current);
      pollerRef.current = null;
      setConnecting(false);

      void loadIntegrations().then(() => {
        const status = useAuthStore.getState().integrations?.[plugin];
        if (status === "connected") {
          toast.success(`${config.name} connected!`);
        } else {
          toast.error(`Couldn't connect ${config.name}. Please try again.`);
        }
      });
    }, 500);
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="bg-panel hairline flex w-full max-w-sm flex-col items-center gap-6 rounded-[var(--radius-card)] p-8 text-center">
        {/* icon */}
        <span className="bg-accent-fill text-accent-light flex h-16 w-16 items-center justify-center rounded-full">
          <i className={`ti ${config.icon} text-3xl`} aria-hidden />
        </span>

        {/* heading */}
        <div>
          <h2 className="text-ink text-lg font-semibold">{config.title}</h2>
          <p className="text-ink-2 mt-2 text-sm leading-relaxed">{config.description}</p>
        </div>

        {/* feature list */}
        <ul className="w-full space-y-2 text-left">
          {config.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <i
                className="ti ti-circle-check text-accent-light mt-px shrink-0 text-base"
                aria-hidden
              />
              <span className="text-ink-2 text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* connect button */}
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting}
          className="bg-accent text-accent-ink hover:bg-accent-light flex w-full items-center justify-center gap-2 rounded-[var(--radius-ctl)] px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {connecting ? (
            <>
              <i className="ti ti-loader-2 animate-spin text-base" aria-hidden />
              Connecting…
            </>
          ) : (
            <>
              <GoogleIcon />
              Connect with Google
            </>
          )}
        </button>

        {/* settings link */}
        <p className="text-ink-3 text-xs">
          Manage all connections in{" "}
          <Link href="/app/settings" className="text-accent-light hover:underline">
            Settings → Connected Apps
          </Link>
        </p>
      </div>
    </div>
  );
}
