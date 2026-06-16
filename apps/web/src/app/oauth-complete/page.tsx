"use client";

import type { GoogleIntegrationPlugin } from "@repo/shared";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/ui/Logo";
import { Spinner } from "@/components/ui/Spinner";

const PLUGINS: readonly GoogleIntegrationPlugin[] = ["gmail", "googlecalendar"];
const POPUP_NAME_PREFIX = "inboxly-oauth-";

function asPlugin(value: string | null): GoogleIntegrationPlugin | null {
  return value && (PLUGINS as readonly string[]).includes(value)
    ? (value as GoogleIntegrationPlugin)
    : null;
}

/**
 * Lands here after the Google OAuth round-trip (the API callback redirects to
 * `?connected=<plugin>` or `?error=...`). When opened in the connect popup it
 * posts the result back to the onboarding page and closes itself; opened
 * directly (no opener) it just falls back to onboarding.
 */
export default function OAuthCompletePage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    // On success the API gives ?connected=<plugin>; on error there's no plugin,
    // so recover it from the popup's name (set when we called window.open).
    const fromName = window.name.startsWith(POPUP_NAME_PREFIX)
      ? window.name.slice(POPUP_NAME_PREFIX.length)
      : null;
    const plugin = asPlugin(params.get("connected")) ?? asPlugin(fromName);
    const ok = Boolean(params.get("connected")) && !errorParam;

    if (window.opener && plugin) {
      try {
        window.opener.postMessage(
          { type: "inboxly-oauth", plugin, ok, error: errorParam ?? undefined },
          window.location.origin,
        );
      } catch {
        /* opener gone; fall through to close */
      }
      window.close();
      return;
    }

    // Opened in the same tab (no popup) — send the user back to finish setup.
    router.replace("/onboarding");
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-5 text-center">
      <Logo />
      <div className="text-ink-2 flex items-center gap-3">
        <Spinner className="text-accent h-5 w-5" />
        <span className="text-sm">Finishing up… you can close this window.</span>
      </div>
    </main>
  );
}
