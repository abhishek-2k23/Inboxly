"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { integrationsLoaded, gmailConnected, calendarConnected } = useAuth();
  const ready = gmailConnected && calendarConnected;

  // Keep the "connect both accounts" requirement intact across every dashboard
  // route: anyone who reaches it without finishing setup is sent to onboarding.
  useEffect(() => {
    if (integrationsLoaded && !ready) router.replace("/onboarding");
  }, [integrationsLoaded, ready, router]);

  if (!integrationsLoaded || !ready) {
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
