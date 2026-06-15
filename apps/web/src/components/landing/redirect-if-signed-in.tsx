"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Mounted on the public home page. Signed-in visitors are sent straight to the
 * app instead of seeing the marketing landing, and an overlay covers the page
 * while the redirect happens to avoid a flash of landing content.
 */
export function RedirectIfSignedIn() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || redirected.current) return;
    redirected.current = true;
    router.replace("/app/inbox");
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) return null;

  return (
    <div className="bg-page fixed inset-0 z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="bg-accent-fill text-accent-light flex h-10 w-10 items-center justify-center rounded-[var(--radius-ctl)]">
          <i className="ti ti-sparkles text-xl" aria-hidden />
        </span>
        <p className="text-ink-2 text-sm">Opening Inboxly…</p>
      </div>
    </div>
  );
}
