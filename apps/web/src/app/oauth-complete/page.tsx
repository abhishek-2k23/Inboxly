"use client";

import { useEffect } from "react";

/**
 * Landing target for the Google OAuth popup once Corsair finishes the token
 * exchange. It deliberately renders no app chrome: the popup just closes
 * itself, which the `NotConnected` poller detects to refresh connection
 * status. If the window can't close (e.g. the flow fell back to a full-page
 * redirect), we send the user back into the app instead.
 */
export default function Page() {
  useEffect(() => {
    if (window.opener && window.opener !== window) {
      window.close();
    } else {
      window.location.replace("/app/chat");
    }
  }, []);

  return (
    <div className="bg-page flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <i className="ti ti-loader-2 text-accent-light animate-spin text-2xl" aria-hidden />
        <p className="text-ink-2 text-sm">You can close this window…</p>
      </div>
    </div>
  );
}
