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

const OAUTH_CHANNEL = "inboxly-oauth";

function isOAuthMessage(data: unknown): data is OAuthMessage {
  return (
    typeof data === "object" && data !== null && (data as { type?: unknown }).type === OAUTH_CHANNEL
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

      function handleOAuthResult(data: OAuthMessage) {
        cleanup();
        setConnecting((prev) => ({ ...prev, [plugin]: false }));
        if (data.ok) {
          setIntegration(plugin, "connected");
          void loadIntegrations();
        } else {
          setError((prev) => ({
            ...prev,
            [plugin]: "Connection failed. Please try again.",
          }));
        }
      }

      // The popup signals its result over three channels (see oauth-complete):
      // a direct postMessage, a BroadcastChannel, and a localStorage write.
      // Once the popup navigates through Google's consent screen, COOP severs
      // window.opener and blocks `popup.closed`, so the latter two — which are
      // origin-scoped and survive that severance — are what actually deliver
      // the result in production. We listen on all three and dedupe.
      const onMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (!isOAuthMessage(event.data) || event.data.plugin !== plugin) return;
        handleOAuthResult(event.data);
      };

      const bc = new BroadcastChannel(OAUTH_CHANNEL);
      const onBCMessage = (event: MessageEvent) => {
        if (!isOAuthMessage(event.data) || event.data.plugin !== plugin) return;
        handleOAuthResult(event.data);
      };
      bc.addEventListener("message", onBCMessage);

      const onStorage = (event: StorageEvent) => {
        if (event.key !== OAUTH_CHANNEL || !event.newValue) return;
        try {
          const data = JSON.parse(event.newValue) as unknown;
          if (!isOAuthMessage(data) || data.plugin !== plugin) return;
          handleOAuthResult(data);
        } catch {
          /* malformed payload; ignore */
        }
      };
      window.addEventListener("storage", onStorage);

      // Best-effort cancellation detection. After COOP severs the popup,
      // reading `popup.closed` is blocked (returns false and warns), so this
      // mainly catches the user closing the blank popup before Google loads.
      const timer = window.setInterval(() => {
        let closed = false;
        try {
          closed = popup.closed;
        } catch {
          /* COOP-severed; can't tell — leave it to the channels above */
        }
        if (closed) {
          cleanup();
          setConnecting((prev) => ({ ...prev, [plugin]: false }));
        }
      }, 500);

      function cleanup() {
        window.removeEventListener("message", onMessage);
        bc.removeEventListener("message", onBCMessage);
        bc.close();
        window.removeEventListener("storage", onStorage);
        window.clearInterval(timer);
        try {
          localStorage.removeItem(OAUTH_CHANNEL);
        } catch {
          /* storage unavailable */
        }
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
