"use client";

import type { GoogleIntegrationPlugin } from "@repo/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { getConnectUrl } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

type PluginFlags = Record<GoogleIntegrationPlugin, boolean>;
type PluginErrors = Record<GoogleIntegrationPlugin, string | null>;

const NO_FLAGS: PluginFlags = { gmail: false, googlecalendar: false };
const NO_ERRORS: PluginErrors = { gmail: null, googlecalendar: null };

interface OAuthMessage {
  type: "inboxly-oauth";
  plugin: GoogleIntegrationPlugin;
  ok: boolean;
  error?: string;
}

function isOAuthMessage(data: unknown): data is OAuthMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { type?: unknown }).type === "inboxly-oauth"
  );
}

/**
 * Drives the Google OAuth connect flow for Gmail / Calendar in a popup window.
 * Each plugin has independent `connecting` / `error` state, and on success the
 * store is updated optimistically (then silently reconciled) so only that one
 * card re-renders — the page is never reloaded.
 */
export function useGoogleConnect() {
  const integrations = useAuthStore((s) => s.integrations);
  const setIntegration = useAuthStore((s) => s.setIntegration);
  const loadIntegrations = useAuthStore((s) => s.loadIntegrations);

  const [connecting, setConnecting] = useState<PluginFlags>(NO_FLAGS);
  const [error, setError] = useState<PluginErrors>(NO_ERRORS);

  // Cleanup callbacks keyed by plugin, so a fresh attempt or unmount tears down listeners/timers.
  const cleanups = useRef<Partial<Record<GoogleIntegrationPlugin, () => void>>>({});

  useEffect(() => {
    const pending = cleanups.current;
    return () => {
      Object.values(pending).forEach((fn) => fn?.());
    };
  }, []);

  const connect = useCallback(
    (plugin: GoogleIntegrationPlugin) => {
      cleanups.current[plugin]?.();
      setError((prev) => ({ ...prev, [plugin]: null }));

      // Open the popup synchronously (so it isn't blocked) before the async
      // fetch below; we point it at the real Google URL once we have it. The
      // window name doubles as the plugin marker the oauth-complete page reads.
      const popup = window.open(
        "about:blank",
        `inboxly-oauth-${plugin}`,
        "width=520,height=660,menubar=no,toolbar=no,location=no,status=no",
      );

      if (!popup) {
        setError((prev) => ({
          ...prev,
          [plugin]: "Popup blocked. Allow popups for this site and try again.",
        }));
        return;
      }

      setConnecting((prev) => ({ ...prev, [plugin]: true }));

      const onMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (!isOAuthMessage(event.data) || event.data.plugin !== plugin) return;

        cleanup();
        setConnecting((prev) => ({ ...prev, [plugin]: false }));
        if (event.data.ok) {
          setIntegration(plugin, "connected");
          void loadIntegrations();
        } else {
          setError((prev) => ({
            ...prev,
            [plugin]: "Connection failed. Please try again.",
          }));
        }
      };

      // Detect the user closing the popup without finishing (cancellation).
      const timer = window.setInterval(() => {
        if (popup.closed) {
          cleanup();
          setConnecting((prev) => ({ ...prev, [plugin]: false }));
        }
      }, 500);

      function cleanup() {
        window.removeEventListener("message", onMessage);
        window.clearInterval(timer);
        delete cleanups.current[plugin];
        try {
          if (!popup!.closed) popup!.close();
        } catch {
          /* cross-origin while mid-flow; ignore */
        }
      }

      window.addEventListener("message", onMessage);
      cleanups.current[plugin] = cleanup;

      // Fetch the Google consent URL with the auth token, then send the popup
      // there. On failure (e.g. token expired → 401) tear down and surface it.
      getConnectUrl(plugin)
        .then((url) => {
          if (popup.closed) return;
          popup.location.href = url;
        })
        .catch(() => {
          cleanup();
          setConnecting((prev) => ({ ...prev, [plugin]: false }));
          setError((prev) => ({
            ...prev,
            [plugin]: "Connection failed. Please try again.",
          }));
        });
    },
    [setIntegration, loadIntegrations],
  );

  return {
    integrations,
    connecting,
    error,
    connect,
  };
}
