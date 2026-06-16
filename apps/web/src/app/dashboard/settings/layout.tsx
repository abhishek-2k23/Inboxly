import type { ReactNode } from "react";

// The settings page now owns its own scroll container and left-rail nav, so
// this layout is a thin passthrough (kept so the /dashboard/settings route
// segment can grow its own loading/error UI later without restructuring).
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
