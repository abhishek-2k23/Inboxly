"use client";

import { type ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ShortcutsModal } from "@/components/dashboard/ShortcutsModal";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/use-auth";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

function DashboardShortcuts() {
  const { shortcutsOpen, setShortcutsOpen } = useKeyboardShortcuts();
  return <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { integrationsLoaded } = useAuth();

  if (!integrationsLoaded) {
    return (
      <div className="bg-bg flex h-screen flex-col items-center justify-center gap-4">
        <Spinner className="text-accent h-6 w-6" />
        <p className="text-ink-2 text-sm">Loading your workspace…</p>
      </div>
    );
  }

  return (
    <div className="bg-bg flex h-screen overflow-hidden">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
      <DashboardShortcuts />
    </div>
  );
}
