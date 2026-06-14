import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#reviews", label: "Reviews" },
];

export function LandingNav() {
  return (
    <header className="bg-page/95 hairline-b sticky top-0 z-50">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Inboxly">
          <span className="bg-accent-fill text-accent-light flex h-8 w-8 items-center justify-center rounded-[var(--radius-ctl)]">
            <i className="ti ti-sparkles text-lg" aria-hidden />
          </span>
          <span className="text-ink text-base font-medium">Inboxly</span>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-ink-2 hover:text-ink text-sm transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/sign-in"
            className="text-ink-2 hover:text-ink hidden text-sm transition-colors sm:inline"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="bg-accent text-accent-ink hover:bg-accent-light rounded-[var(--radius-ctl)] px-4 py-2 text-sm font-medium transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}
