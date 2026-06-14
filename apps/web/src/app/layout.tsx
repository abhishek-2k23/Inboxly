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

// Runs before paint to apply the saved/preferred theme and avoid a
// flash of the wrong theme on load.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#4f7cff",
          colorBackground: "#f7f7f9",
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
          <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        </head>
        <body className="bg-page text-ink min-h-screen antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
