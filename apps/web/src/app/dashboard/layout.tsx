"use client";

import { type ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { integrationsLoaded } = useAuth();

  // We no longer force a redirect to onboarding when integrations are missing —
  // each workspace (AI agent, inbox, calendar) gates itself and shows an inline
  // connect prompt, so the user can disconnect/reconnect without leaving.
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
    </div>
  );
}
