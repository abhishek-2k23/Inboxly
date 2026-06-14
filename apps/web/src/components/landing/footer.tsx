import Link from "next/link";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "AI Demo", href: "#demo" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help Center", href: "#" },
      { label: "Documentation", href: "#" },
      { label: "API", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
];

const SOCIALS = [
  { label: "X (Twitter)", icon: "ti-brand-x", href: "#" },
  { label: "LinkedIn", icon: "ti-brand-linkedin", href: "#" },
  { label: "GitHub", icon: "ti-brand-github", href: "#" },
];

export function Footer() {
  return (
    <footer className="hairline-t bg-page px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-ink text-sm font-medium">{column.title}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-ink-2 hover:text-ink text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="hairline-t mt-10 flex flex-col items-center gap-4 pt-6 sm:flex-row sm:justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="Inboxly">
            <span className="bg-accent-fill text-accent-light flex h-7 w-7 items-center justify-center rounded-[var(--radius-ctl)]">
              <i className="ti ti-sparkles text-sm" aria-hidden />
            </span>
            <span className="text-ink text-sm font-medium">Inboxly</span>
          </Link>

          <p className="text-ink-3 text-xs">
            © {new Date().getFullYear()} Inboxly. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="text-ink-2 hover:text-ink transition-colors"
              >
                <i className={`ti ${social.icon} text-lg`} aria-hidden />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
