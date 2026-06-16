"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "@/components/toast";
import { clerkAppearance } from "@/lib/clerk-appearance";

/**
 * Client-side provider stack. `next-themes` owns the `.dark` class on <html>
 * (matched by the tokens in globals.css), and Clerk's widgets inherit the same
 * design tokens via `clerkAppearance`.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <ClerkProvider appearance={clerkAppearance} afterSignOutUrl="/">
        {children}
        <Toaster />
      </ClerkProvider>
    </ThemeProvider>
  );
}
