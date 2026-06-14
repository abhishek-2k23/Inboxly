import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Inboxly — Email & calendar, run by a single prompt",
  description:
    "Prompt-first AI email and calendar client. Send mail, draft replies, and manage your calendar by just typing what you need.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#1d9e75",
          colorBackground: "#101010",
          borderRadius: "8px",
        },
      }}
    >
      <html lang="en" className={inter.variable}>
        <head>
          {/* Tabler outline icons — used for every action across the app */}
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.24.0/dist/tabler-icons.min.css"
          />
        </head>
        <body className="bg-page text-ink min-h-screen antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
