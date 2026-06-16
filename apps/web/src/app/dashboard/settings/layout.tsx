"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/ui";

const TABS = [
  { href: "/dashboard/settings/profile", label: "Profile" },
  { href: "/dashboard/settings/plan", label: "Plan & Billing" },
  { href: "/dashboard/settings/integrations", label: "Integrations" },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  // Measure the active tab and slide a single indicator under it, instead of
  // toggling a border per-tab — reads as one continuous, premium motion.
  useLayoutEffect(() => {
    const el = tabRefs.current[TABS.findIndex((t) => t.href === pathname)];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [pathname]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <header className="animate-rise-in">
          <h1 className="text-ink text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-ink-2 mt-1.5 text-sm">
            Manage your account, plan, and connected apps.
          </p>
        </header>

        <nav className="border-line relative mt-8 flex gap-6 border-b">
          {TABS.map((tab, i) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                className={cn(
                  "-mb-px pb-3 text-sm font-medium transition-colors",
                  active ? "text-ink" : "text-ink-2 hover:text-ink",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
          {indicator && (
            <span
              className="bg-accent absolute bottom-0 h-[2px] rounded-full transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ left: indicator.left, width: indicator.width }}
            />
          )}
        </nav>

        <div key={pathname} className="animate-rise-in py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
