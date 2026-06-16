"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Inbox,
  Send,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useChatStore } from "@/stores/chat-store";
import { useDashboardStore } from "@/stores/dashboard-store";
import { cn } from "@/lib/ui";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Starting a new chat when navigating to the agent. */
  resetChat?: boolean;
}

const NAV: NavItem[] = [
  { label: "AI Agent", href: "/dashboard", icon: Sparkles, resetChat: true },
  { label: "Inbox", href: "/dashboard/inbox", icon: Inbox },
  { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const collapsed = useDashboardStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useDashboardStore((s) => s.toggleSidebar);
  const newChat = useChatStore((s) => s.newChat);

  return (
    <aside
      className={cn(
        "border-line bg-bg-secondary relative flex shrink-0 flex-col border-r transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      {/* Collapse toggle — centered on the right border, aligned to the logo row. */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="border-line bg-panel text-ink-2 hover:text-ink hover:border-line-strong absolute right-0 top-8 z-20 grid h-6 w-6 -translate-y-1/2 translate-x-1/2 place-items-center rounded-full border transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Logo row (h-16 → its vertical center matches the toggle's top-8). */}
      <div className={cn("flex h-16 items-center", collapsed ? "justify-center px-0" : "px-5")}>
        <Link href="/dashboard" onClick={() => newChat()} className="flex items-center gap-2">
          <span className="bg-accent text-accent-ink grid h-7 w-7 shrink-0 place-items-center rounded-[7px]">
            <Inbox className="h-4 w-4" strokeWidth={2.25} />
          </span>
          {!collapsed && (
            <span className="text-ink text-[1.05rem] font-semibold tracking-tight">Inboxly</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              onClick={() => item.resetChat && newChat()}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg py-2.5 text-sm transition-colors",
                collapsed ? "justify-center px-0" : "px-3",
                active
                  ? "bg-surface text-ink font-medium"
                  : "text-ink-2 hover:bg-surface hover:text-ink",
              )}
            >
              {active && (
                <span className="bg-accent absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full" />
              )}
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="border-line border-t p-3">
        <div className={cn("flex items-center gap-3", collapsed && "flex-col gap-2")}>
          <UserButton appearance={{ elements: { avatarBox: "h-8 w-8 rounded-full" } }} />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-ink truncate text-sm font-medium">
                {user?.fullName ?? user?.firstName ?? "Account"}
              </p>
              <p className="text-ink-3 truncate text-xs">
                {user?.primaryEmailAddress?.emailAddress ?? ""}
              </p>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
