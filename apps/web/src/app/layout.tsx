import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Inboxly — AI-Powered Email & Calendar Workspace",
  description:
    "Inboxly helps you summarize emails, draft replies, schedule meetings, and manage your day without switching between tools.",
  verification: {
    google: "t0GI7xG7uC2atNb2O6unD7CbNSTNy9rK3AiOpZlGWo4",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
