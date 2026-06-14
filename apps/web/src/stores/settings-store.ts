import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  vipSenders: string;
  urgentKeywords: string;
  autoCategorize: boolean;
  sensitivity: number;
  setVipSenders: (value: string) => void;
  setUrgentKeywords: (value: string) => void;
  setAutoCategorize: (value: boolean) => void;
  setSensitivity: (value: number) => void;
}

/** AI/filtering preferences from the Settings > AI Preferences tab, persisted locally. */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      vipSenders: "",
      urgentKeywords: "urgent, asap, deadline",
      autoCategorize: true,
      sensitivity: 60,
      setVipSenders: (value) => set({ vipSenders: value }),
      setUrgentKeywords: (value) => set({ urgentKeywords: value }),
      setAutoCategorize: (value) => set({ autoCategorize: value }),
      setSensitivity: (value) => set({ sensitivity: value }),
    }),
    { name: "inboxly-settings" },
  ),
);
