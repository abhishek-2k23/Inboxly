"use client";

import type { GoogleIntegrationPlugin } from "@repo/shared";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Spinner } from "@/components/ui/Spinner";

const PLUGINS: readonly GoogleIntegrationPlugin[] = ["gmail", "googlecalendar"];
const POPUP_NAME_PREFIX = "inboxly-oauth-";
const OAUTH_CHANNEL = "inboxly-oauth";

function asPlugin(value: string | null): GoogleIntegrationPlugin | null {
  return value && (PLUGINS as readonly string[]).includes(value)
    ? (value as GoogleIntegrationPlugin)
    : null;
}

type Phase = "working" | "ok" | "error" | "same-tab";

/**
 * Lands here after the Google OAuth round-trip (the API callback redirects to
 * `?connected=<plugin>` on success or `?error=...&plugin=<plugin>` on failure).
 *
 * By the time we get here the popup has navigated through Google's consent
 * screen (cross-origin), so the browser has severed `window.opener` and moved
 * this window to a different browsing-context group. We therefore signal the
 * opener over origin-scoped channels (BroadcastChannel + a localStorage write)
 * which survive that severance, and then try to close. `window.close()` is
 * usually blocked here too (the popup accrued several history entries and is no
 * longer "script-closable"), so we fall back to telling the user they can close
 * the window — the parent tab has already updated itself from our message.
 */
export default function OAuthCompletePage() {
  const [phase, setPhase] = useState<Phase>("working");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    const fromName = window.name.startsWith(POPUP_NAME_PREFIX)
      ? window.name.slice(POPUP_NAME_PREFIX.length)
      : null;
    const plugin =
      asPlugin(params.get("connected")) ?? asPlugin(params.get("plugin")) ?? asPlugin(fromName);
    const ok = Boolean(params.get("connected")) && !errorParam;
    const msg = { type: OAUTH_CHANNEL, plugin, ok, error: errorParam ?? undefined };

    // No plugin at all means this wasn't a popup connect flow (e.g. opened in
    // the same tab) — there's no opener to notify, just show a continue link.
    if (!plugin) {
      setPhase("same-tab");
      return;
    }

    // 1) Direct opener message — only works if COOP didn't sever the link.
    try {
      window.opener?.postMessage(msg, window.location.origin);
    } catch {
      /* opener gone */
    }

    // 2) BroadcastChannel — origin-scoped, survives the COOP severance above.
    try {
      const bc = new BroadcastChannel(OAUTH_CHANNEL);
      bc.postMessage(msg);
      bc.close();
    } catch {
      /* BroadcastChannel unavailable */
    }

    // 3) localStorage write — fires a `storage` event in the opener tab; a
    //    belt-and-braces fallback for browsers where (2) is unreliable.
    try {
      localStorage.setItem(OAUTH_CHANNEL, JSON.stringify({ ...msg, at: Date.now() }));
    } catch {
      /* storage unavailable */
    }

    // Try to close ourselves. Usually blocked after the multi-step OAuth
    // redirect, so if we're still here a moment later, show a closeable state.
    window.close();
    const timer = window.setTimeout(() => setPhase(ok ? "ok" : "error"), 400);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-5 text-center">
      <Logo />
      <div className="text-ink-2 flex items-center gap-3">
        {phase === "working" && (
          <>
            <Spinner className="text-accent h-5 w-5" />
            <span className="text-sm">Finishing up…</span>
          </>
        )}
        {phase === "ok" && <span className="text-sm">Connected! You can close this window.</span>}
        {phase === "error" && (
          <span className="text-sm">
            Something went wrong. You can close this window and try again.
          </span>
        )}
        {phase === "same-tab" && (
          <a href="/onboarding" className="text-accent text-sm underline">
            Continue to Inboxly
          </a>
        )}
      </div>
    </main>
  );
}
