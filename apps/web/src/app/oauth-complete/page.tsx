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
    // On success the API gives ?connected=<plugin>.
    // On error it gives ?error=...&plugin=<plugin> (backend extracts plugin
    // from the Corsair state JWT so we still know which flow failed).
    // Last resort: recover from the popup's window name — though modern
    // browsers clear window.name after cross-origin navigation, so this
    // rarely fires in practice.
    const fromName = window.name.startsWith(POPUP_NAME_PREFIX)
      ? window.name.slice(POPUP_NAME_PREFIX.length)
      : null;
    const plugin =
      asPlugin(params.get("connected")) ?? asPlugin(params.get("plugin")) ?? asPlugin(fromName);
    const ok = Boolean(params.get("connected")) && !errorParam;

    const msg = { type: "inboxly-oauth", plugin, ok, error: errorParam ?? undefined };

    if (window.opener && plugin) {
      try {
        window.opener.postMessage(msg, window.location.origin);
      } catch {
        /* opener gone; fall through to BroadcastChannel */
      }
      window.close();
      // Fallback if close is blocked (some browsers block it after cross-origin
      // navigation strips the "was script-opened" flag).
      router.replace("/dashboard");
      return;
    }

    // window.opener is stripped by browsers after the popup navigates through
    // a cross-origin page (Google's consent screen). Use BroadcastChannel so
    // the parent tab still receives the result, then close anyway.
    if (plugin) {
      try {
        const bc = new BroadcastChannel("inboxly-oauth");
        bc.postMessage(msg);
        bc.close();
      } catch {
        /* BroadcastChannel unavailable */
      }
      window.close();
      // Fallback: if close is blocked, send the user to the dashboard rather
      // than leaving them on the spinner indefinitely.
      router.replace("/dashboard");
      return;
    }

    // No plugin info at all — opened in the same tab, redirect to finish setup.
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
