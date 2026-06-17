import { Platform } from "react-native";

/**
 * Inboxly design tokens — mirrors apps/web/src/app/globals.css.
 * Access via the useTheme() hook which reads the system colour scheme.
 */
export const Colors = {
  light: {
    // surfaces
    bg: "#efeff2",
    bgSecondary: "#f2f2f5",
    panel: "#f7f7f9",
    surface: "#eaeaed",
    surfaceHover: "#e2e2e7",
    // text
    ink: "#2a2a2e",
    ink2: "#8e8e93",
    ink3: "#a6a6ab",
    // borders
    line: "#dcdce0",
    lineSubtle: "#e2e2e6",
    lineStrong: "#c8c8ce",
    // accent (blue primary)
    accent: "#4f7cff",
    accentLight: "#6690ff",
    accentInk: "#f5f5f7",
    primary: "#4f7cff",
    primarySoft: "#e1e8ff",
    // status
    success: "#16a34a",
    warning: "#d89a2e",
    danger: "#dc4a60",
    // priority
    prioUrgent: "#dc4a60",
    prioMedium: "#d89a2e",
    prioLow: "#4f7cff",
    prioNone: "#a6a6ab",
  },
  dark: {
    bg: "#090909",
    bgSecondary: "#0c0c0c",
    panel: "#121212",
    surface: "#1a1a1d",
    surfaceHover: "#222226",
    ink: "#f5f5f5",
    ink2: "#a1a1aa",
    ink3: "#6b6b70",
    line: "#232326",
    lineSubtle: "#1d1d20",
    lineStrong: "#2e2e33",
    accent: "#00c2ff",
    accentLight: "#33cfff",
    accentInk: "#04222b",
    primary: "#00c2ff",
    primarySoft: "#0a2a36",
    success: "#22c55e",
    warning: "#ffc56c",
    danger: "#ff6b81",
    prioUrgent: "#ff6b81",
    prioMedium: "#ffc56c",
    prioLow: "#00c2ff",
    prioNone: "#6b6b70",
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
