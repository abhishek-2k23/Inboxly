import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DashboardUiState {
  /** Left navigation sidebar collapsed to icons-only. */
  sidebarCollapsed: boolean;
  /** Right "Conversation History" sidebar open. */
  historyOpen: boolean;
  /** Set to true by the keyboard shortcut; InboxView clears it after opening compose. */
  composePending: boolean;
  toggleSidebar: () => void;
  setSidebar: (collapsed: boolean) => void;
  toggleHistory: () => void;
  setHistory: (open: boolean) => void;
  requestCompose: () => void;
  clearComposePending: () => void;
}

/** Persisted dashboard chrome state, so collapse/open survives reloads. */
export const useDashboardStore = create<DashboardUiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      historyOpen: false,
      composePending: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebar: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleHistory: () => set((s) => ({ historyOpen: !s.historyOpen })),
      setHistory: (open) => set({ historyOpen: open }),
      requestCompose: () => set({ composePending: true }),
      clearComposePending: () => set({ composePending: false }),
    }),
    { name: "inboxly-dashboard-ui" },
  ),
);
