import { Platform } from "react-native";

/**
 * Inboxly design tokens — mirrors apps/web/src/app/globals.css.
 * Access via the useTheme() hook which reads the system colour scheme.
 */
export const Colors = {
  light: {
    // surfaces
    bg: "#ffffff",
    bgSecondary: "#fafafa",
    panel: "#ffffff",
    surface: "#fafafa",
    surfaceHover: "#f8f8f8",
    // text
    ink: "#111827",
    ink2: "#4b5563",
    ink3: "#6b7280",
    // borders
    line: "rgba(0,0,0,0.08)",
    lineSubtle: "rgba(0,0,0,0.04)",
    lineStrong: "rgba(0,0,0,0.16)",
    // accent (indigo)
    accent: "#6366f1",
    accentLight: "#5558e8",
    accentInk: "#f5f5f7",
    primary: "#6366f1",
    primarySoft: "rgba(99,102,241,0.08)",
    // status
    success: "#16a34a",
    warning: "#d97706",
    danger: "#dc2626",
    // priority
    prioUrgent: "#d97706",
    prioMedium: "#6366f1",
    prioLow: "#16a34a",
    prioNone: "#6b7280",
  },
  dark: {
    bg: "#0b0b0f",
    bgSecondary: "#111117",
    panel: "#15151d",
    surface: "#111117",
    surfaceHover: "#1a1a24",
    ink: "#f5f5f7",
    ink2: "#a1a1aa",
    ink3: "#6b7280",
    line: "rgba(255,255,255,0.08)",
    lineSubtle: "rgba(255,255,255,0.04)",
    lineStrong: "rgba(255,255,255,0.16)",
    accent: "#6366f1",
    accentLight: "#7376ff",
    accentInk: "#f5f5f7",
    primary: "#6366f1",
    primarySoft: "rgba(99,102,241,0.10)",
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
    prioUrgent: "#f59e0b",
    prioMedium: "#6366f1",
    prioLow: "#22c55e",
    prioNone: "#6b7280",
  },
} as const;

export type AppColors = typeof Colors.light;

/** 4 px grid spacing scale */
export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Font = Platform.select({
  ios: { sans: "System", mono: "Menlo-Regular" },
  default: { sans: "normal", mono: "monospace" },
})!;
