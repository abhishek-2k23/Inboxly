"use client";

import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/ui";

const NAV = [
  { href: "/app/chat", icon: "ti-message-2", label: "Chat", shortcut: "G T" },
  { href: "/app/inbox", icon: "ti-inbox", label: "Inbox", shortcut: "G I" },
  { href: "/app/calendar", icon: "ti-calendar", label: "Calendar", shortcut: "G C" },
  { href: "/app/settings", icon: "ti-settings", label: "Settings", shortcut: "G S" },
];

const STORAGE_KEY = "nav-expanded";

export function AppNav() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  // Restore the saved preference after mount (avoids SSR hydration mismatch).
  useEffect(() => {
    setExpanded(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  function toggle() {
    setExpanded((v) => {
      const next = !v;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <nav
      className={cn(
        "bg-panel hairline-r flex h-screen shrink-0 flex-col gap-1 py-4 transition-[width] duration-200",
        expanded ? "w-56 px-3" : "w-16 items-center px-0",
      )}
    >
      {/* logo + collapse toggle */}
      <div
        className={cn(
          "mb-3 flex items-center",
          expanded ? "w-full justify-between" : "justify-center",
        )}
      >
        <Link
          href="/app/chat"
          aria-label="Inboxly"
          className={cn(
            "flex items-center gap-2",
            !expanded &&
              "bg-accent-fill text-accent-light h-10 w-10 justify-center rounded-[var(--radius-ctl)]",
          )}
        >
          <span
            className={cn(
              "flex items-center justify-center",
              expanded && "bg-accent-fill text-accent-light h-8 w-8 rounded-[var(--radius-ctl)]",
            )}
          >
            <i className={cn("ti ti-sparkles", expanded ? "text-lg" : "text-xl")} aria-hidden />
          </span>
          {expanded && <span className="text-ink text-base font-medium">Inboxly</span>}
        </Link>
        {expanded && (
          <button
            type="button"
            onClick={toggle}
            aria-label="Collapse sidebar"
            className="text-ink-2 hover:bg-surface-hover hover:text-ink flex h-8 w-8 items-center justify-center rounded-[var(--radius-ctl)] transition-colors"
          >
            <i className="ti ti-layout-sidebar-left-collapse text-lg" aria-hidden />
          </button>
        )}
      </div>

      {!expanded && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Expand sidebar"
          className="text-ink-2 hover:bg-surface-hover hover:text-ink mb-1 flex h-10 w-10 items-center justify-center rounded-[var(--radius-ctl)] transition-colors"
        >
          <i className="ti ti-layout-sidebar-left-expand text-xl" aria-hidden />
        </button>
      )}

      {NAV.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <span key={item.href} className="group/nav relative">
            <Link
              href={item.href}
              aria-label={item.label}
              className={cn(
                "flex h-10 items-center rounded-[var(--radius-ctl)] transition-colors",
                expanded ? "w-full gap-3 px-3" : "w-10 justify-center",
                active
                  ? "bg-accent-fill text-accent-light"
                  : "text-ink-2 hover:bg-surface-hover hover:text-ink",
              )}
            >
              <i className={cn("ti shrink-0 text-xl", item.icon)} aria-hidden />
              {expanded && <span className="flex-1 truncate text-sm">{item.label}</span>}
              {expanded && <span className="text-ink-3 text-xs">{item.shortcut}</span>}
            </Link>
            {!expanded && (
              <span className="bg-surface text-ink-2 hairline pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-ctl)] px-2 py-1 text-xs group-hover/nav:block">
                {item.label}
                <span className="text-ink-3 ml-2">{item.shortcut}</span>
              </span>
            )}
          </span>
        );
      })}

      <div
        className={cn(
          "mt-auto flex gap-2",
          expanded ? "items-center px-1" : "flex-col items-center",
        )}
      >
        <ThemeToggle />
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </nav>
  );
}
