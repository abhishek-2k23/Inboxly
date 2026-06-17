"use client";

import type { GoogleIntegrationPlugin } from "@repo/shared";
import { useCallback, useEffect, useState } from "react";
import { getConnectUrl } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

type PluginFlags = Record<GoogleIntegrationPlugin, boolean>;
type PluginErrors = Record<GoogleIntegrationPlugin, string | null>;

const NO_FLAGS: PluginFlags = { gmail: false, googlecalendar: false };
const NO_ERRORS: PluginErrors = { gmail: null, googlecalendar: null };

const PLUGINS: readonly GoogleIntegrationPlugin[] = ["gmail", "googlecalendar"];

// Where to send the user back to after the OAuth round-trip. Persists across the
// full-page redirect to Google because sessionStorage is scoped to the tab and
// survives cross-origin navigations within it.
const RETURN_KEY = "inboxly-oauth-return";

function asPlugin(value: string | null): GoogleIntegrationPlugin | null {
  return value && (PLUGINS as readonly string[]).includes(value)
    ? (value as GoogleIntegrationPlugin)
    : null;
}

/**
 * Drives the Google OAuth connect flow for Gmail / Calendar via a same-tab
 * redirect. Clicking connect navigates the whole page to Google's consent
 * screen; after the round-trip the user lands back on the page they started
 * from (see oauth-complete), which reads the `?connected` / `?error` params to
 * reconcile the integration state.
 */
export function useGoogleConnect() {
  const integrations = useAuthStore((s) => s.integrations);
  const setIntegration = useAuthStore((s) => s.setIntegration);
  const loadIntegrations = useAuthStore((s) => s.loadIntegrations);

  const [connecting, setConnecting] = useState<PluginFlags>(NO_FLAGS);
  const [error, setError] = useState<PluginErrors>(NO_ERRORS);

  // On return from Google, the oauth-complete page forwards its result params to
  // the page we started on. Pick them up, reconcile state, then strip them so a
  // refresh doesn't replay the result.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = asPlugin(params.get("connected"));
    const errored = params.get("error");
    const errorPlugin = asPlugin(params.get("plugin"));

    if (!connected && !errored) return;

    if (connected) {
      setIntegration(connected, "connected");
      void loadIntegrations();
    } else if (errorPlugin) {
      setError((prev) => ({
        ...prev,
        [errorPlugin]: "Connection failed. Please try again.",
      }));
    }

    params.delete("connected");
    params.delete("error");
    params.delete("plugin");
    const query = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (query ? `?${query}` : ""));
  }, [setIntegration, loadIntegrations]);

  const connect = useCallback((plugin: GoogleIntegrationPlugin) => {
    setError((prev) => ({ ...prev, [plugin]: null }));
    setConnecting((prev) => ({ ...prev, [plugin]: true }));

    // Remember where we are so oauth-complete can bring us back here.
    try {
      sessionStorage.setItem(RETURN_KEY, window.location.pathname);
    } catch {
      /* storage unavailable; oauth-complete falls back to /onboarding */
    }

    // Fetch the Google consent URL with the auth token, then redirect the whole
    // tab to it. On failure (e.g. token expired → 401) surface the error.
    getConnectUrl(plugin)
      .then((url) => {
        window.location.assign(url);
      })
      .catch(() => {
        setConnecting((prev) => ({ ...prev, [plugin]: false }));
        setError((prev) => ({
          ...prev,
          [plugin]: "Connection failed. Please try again.",
        }));
      });
  }, []);

  return {
    integrations,
    connecting,
    error,
    connect,
  };
}
