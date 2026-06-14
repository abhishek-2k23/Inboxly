"use client";

import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/ui";

const NAV = [
  { href: "/app/inbox", icon: "ti-inbox", label: "Inbox", shortcut: "G I" },
  { href: "/app/calendar", icon: "ti-calendar", label: "Calendar", shortcut: "G C" },
  { href: "/app/settings", icon: "ti-settings", label: "Settings", shortcut: "G S" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-panel hairline-r flex h-screen w-16 shrink-0 flex-col items-center gap-1 py-4">
      <Link
        href="/app/inbox"
        aria-label="Inboxly"
        className="bg-accent-fill text-accent-light mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--radius-ctl)]"
      >
        <i className="ti ti-sparkles text-xl" aria-hidden />
      </Link>

      {NAV.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <span key={item.href} className="group/nav relative">
            <Link
              href={item.href}
              aria-label={item.label}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-[var(--radius-ctl)] transition-colors",
                active
                  ? "bg-accent-fill text-accent-light"
                  : "text-ink-2 hover:bg-surface-hover hover:text-ink",
              )}
            >
              <i className={cn("ti text-xl", item.icon)} aria-hidden />
            </Link>
            <span className="bg-surface text-ink-2 hairline pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-ctl)] px-2 py-1 text-xs group-hover/nav:block">
              {item.label}
              <span className="text-ink-3 ml-2">{item.shortcut}</span>
            </span>
          </span>
        );
      })}

      <div className="mt-auto">
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </nav>
  );
}
