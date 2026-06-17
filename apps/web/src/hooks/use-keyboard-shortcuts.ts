"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useChatStore } from "@/stores/chat-store";
import { useDashboardStore } from "@/stores/dashboard-store";

/** Returns true when the event originates from a text-input element. */
function isEditing(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable
  );
}

export function useKeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const newChat = useChatStore((s) => s.newChat);
  const toggleSidebar = useDashboardStore((s) => s.toggleSidebar);
  const requestCompose = useDashboardStore((s) => s.requestCompose);

  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const gTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useCallback(
    (href: string, resetChat = false) => {
      if (resetChat) newChat();
      router.push(href);
    },
    [router, newChat],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isEditing(e)) return;

      const key = e.key;
      const lower = key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;

      // ── Single-key navigation ─────────────────────────────────────────────
      if (!ctrl) {
        switch (lower) {
          case "a":
            navigate("/dashboard", true);
            return;
          case "i":
            navigate("/dashboard/inbox");
            return;
          case "s":
            navigate("/dashboard/sent");
            return;
          case "d":
            navigate("/dashboard/drafts");
            return;
          case "r":
            navigate("/dashboard/archive");
            return;
          case "c":
            navigate("/dashboard/calendar");
            return;
          case "b":
            navigate("/dashboard/billing");
            return;

          case "e":
            // Compose — only on inbox-family pages
            if (
              pathname.startsWith("/dashboard/inbox") ||
              pathname.startsWith("/dashboard/sent") ||
              pathname.startsWith("/dashboard/drafts") ||
              pathname.startsWith("/dashboard/archive")
            ) {
              requestCompose();
            }
            return;

          case "\\":
            e.preventDefault();
            toggleSidebar();
            return;

          case "?":
            setShortcutsOpen((o) => !o);
            return;

          case "escape":
            setShortcutsOpen(false);
            return;
        }
      }

      // ── Modifier shortcuts ────────────────────────────────────────────────
      if (ctrl) {
        switch (lower) {
          case "n":
            e.preventDefault();
            navigate("/dashboard", true);
            return;

          case ",":
            e.preventDefault();
            navigate("/dashboard/settings");
            return;
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const timerRef = gTimerRef;
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [navigate, pathname, toggleSidebar, requestCompose]);

  return { shortcutsOpen, setShortcutsOpen };
}
