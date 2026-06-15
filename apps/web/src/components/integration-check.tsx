"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuthStore } from "@/stores/auth-store";

export function IntegrationCheck() {
  const { isSignedIn } = useUser();
  const loadIntegrations = useAuthStore((s) => s.loadIntegrations);

  useEffect(() => {
    if (isSignedIn) void loadIntegrations();
  }, [isSignedIn, loadIntegrations]);

  return null;
}
