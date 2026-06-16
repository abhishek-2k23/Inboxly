"use client";

import { Check, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

/**
 * One integration row on the onboarding screen. Fully presentational — its
 * connecting/connected/error state is owned by `useGoogleConnect` so each card
 * updates independently.
 */
export function ConnectCard({
  icon: Icon,
  title,
  description,
  connected,
  connecting,
  error,
  onConnect,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  onConnect: () => void;
}) {
  return (
    <div className="bg-panel hairline flex items-center gap-4 rounded-2xl p-5">
      <span className="bg-surface text-ink-2 hairline grid h-11 w-11 shrink-0 place-items-center rounded-xl">
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-ink text-sm font-semibold">{title}</p>
        <p className="text-ink-2 mt-0.5 text-sm">
          {error ? <span className="text-danger">{error}</span> : description}
        </p>
      </div>

      {connected ? (
        <span className="bg-primary-soft text-accent inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium">
          <Check className="h-3.5 w-3.5" />
          Connected
        </span>
      ) : (
        <Button
          variant={error ? "outline" : "primary"}
          size="sm"
          className="shrink-0"
          onClick={onConnect}
          disabled={connecting}
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
      )}
    </div>
  );
}
