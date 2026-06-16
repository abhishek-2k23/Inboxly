"use client";

import { Check, Unplug } from "lucide-react";
import { useState } from "react";
import type { GoogleIntegrationPlugin } from "@repo/shared";
import { useToast } from "@/components/toast";
import { INTEGRATION_META, tintStyle } from "@/components/dashboard/ConnectPrompt";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { useAuth } from "@/hooks/use-auth";
import { useGoogleConnect } from "@/hooks/use-google-connect";
import { disconnectIntegration } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const PLUGINS: GoogleIntegrationPlugin[] = ["gmail", "googlecalendar"];

export default function IntegrationsPage() {
  const { gmailConnected, calendarConnected } = useAuth();
  const { connecting, connect } = useGoogleConnect();
  const setIntegration = useAuthStore((s) => s.setIntegration);
  const toast = useToast();
  const [busy, setBusy] = useState<GoogleIntegrationPlugin | null>(null);

  const connected: Record<GoogleIntegrationPlugin, boolean> = {
    gmail: gmailConnected,
    googlecalendar: calendarConnected,
  };

  async function handleDisconnect(plugin: GoogleIntegrationPlugin) {
    setBusy(plugin);
    try {
      await disconnectIntegration(plugin);
      setIntegration(plugin, "not_connected");
      toast.success(`Disconnected ${INTEGRATION_META[plugin].short}`);
    } catch {
      toast.error("Couldn't disconnect. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="animate-rise-in space-y-6">
      <div>
        <h3 className="text-ink text-sm font-semibold">Connected accounts</h3>
        <p className="text-ink-2 mt-1 text-sm">
          Manage the Google services Inboxly can access. Disconnecting hides the related workspace
          until you reconnect.
        </p>
      </div>

      <div className="space-y-3">
        {PLUGINS.map((plugin) => {
          const meta = INTEGRATION_META[plugin];
          const Icon = meta.icon;
          const isConnected = connected[plugin];

          return (
            <SpotlightCard key={plugin} className="flex items-center gap-4 p-4">
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                style={tintStyle(meta.color)}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-ink text-sm font-semibold">{meta.short}</p>
                <p className="mt-0.5 text-xs">
                  {isConnected ? (
                    <span className="text-success inline-flex items-center gap-1 font-medium">
                      <Check className="h-3 w-3" /> Connected
                    </span>
                  ) : (
                    <span className="text-ink-3">{meta.description}</span>
                  )}
                </p>
              </div>
              {isConnected ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDisconnect(plugin)}
                  disabled={busy === plugin}
                  className="text-danger hover:bg-danger/10 hover:border-danger/40 shrink-0"
                >
                  {busy === plugin ? (
                    <Spinner className="h-3.5 w-3.5" />
                  ) : (
                    <>
                      <Unplug className="h-3.5 w-3.5" />
                      Disconnect
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => connect(plugin)}
                  disabled={connecting[plugin]}
                  className="shrink-0"
                >
                  {connecting[plugin] ? <Spinner className="h-3.5 w-3.5" /> : "Connect"}
                </Button>
              )}
            </SpotlightCard>
          );
        })}
      </div>
    </div>
  );
}
