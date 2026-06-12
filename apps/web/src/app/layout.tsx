import { ClerkProvider, Show, SignInButton, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Hackathon Starter",
  description: "Next.js + Express + Postgres + OpenAI monorepo starter",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
          <header className="flex items-center justify-end gap-4 p-4">
            <Show when="signed-out">
              <SignInButton />
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
