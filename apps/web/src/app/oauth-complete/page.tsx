"use client";

import { useEffect } from "react";
import { Logo } from "@/components/ui/Logo";
import { Spinner } from "@/components/ui/Spinner";

const RETURN_KEY = "inboxly-oauth-return";
const DEFAULT_RETURN = "/onboarding";

/**
 * Lands here after the Google OAuth round-trip (the API callback redirects to
 * `?connected=<plugin>` on success or `?error=...&plugin=<plugin>` on failure).
 *
 * The flow is same-tab, so there's no opener to notify — we just send the user
 * back to the page they started the connect from (remembered in sessionStorage),
 * forwarding the result params so that page can reconcile its integration state.
 */
export default function OAuthCompletePage() {
  useEffect(() => {
    const search = window.location.search;

    let returnPath = DEFAULT_RETURN;
    try {
      const stored = sessionStorage.getItem(RETURN_KEY);
      if (stored?.startsWith("/")) returnPath = stored;
      sessionStorage.removeItem(RETURN_KEY);
    } catch {
      /* storage unavailable; fall back to the default */
    }

    window.location.replace(returnPath + search);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-5 text-center">
      <Logo />
      <div className="text-ink-2 flex items-center gap-3">
        <Spinner className="text-accent h-5 w-5" />
        <span className="text-sm">Finishing up…</span>
      </div>
    </main>
  );
}
