import { Container } from "@/components/ui/Container";
import { GithubIcon, InstagramIcon, LinkedinIcon, XIcon } from "@/components/ui/BrandIcons";
import { Logo } from "@/components/ui/Logo";
import { FOOTER_COLUMNS } from "@/utils/landing-data";

const SOCIALS = [
  { icon: XIcon, label: "Twitter" },
  { icon: InstagramIcon, label: "Instagram" },
  { icon: LinkedinIcon, label: "LinkedIn" },
  { icon: GithubIcon, label: "GitHub" },
];

// Glowing accent "nodes" sprinkled over the tech grid (left / bottom offsets).
const NODES = [
  { left: "14%", bottom: "34%" },
  { left: "32%", bottom: "12%" },
  { left: "48%", bottom: "44%" },
  { left: "63%", bottom: "20%" },
  { left: "81%", bottom: "38%" },
  { left: "92%", bottom: "16%" },
];

export function Footer() {
  return (
    <footer className="border-line-subtle relative overflow-hidden border-t">
      {/* elegant tech motif rising from the bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72" aria-hidden>
        <div className="tech-grid absolute inset-0 opacity-70" />
        <div
          className="absolute -bottom-32 left-1/2 h-72 w-[820px] max-w-[130vw] -translate-x-1/2 rounded-full blur-[110px]"
          style={{ background: "var(--color-glow)" }}
        />
        {NODES.map((node) => (
          <span
            key={`${node.left}-${node.bottom}`}
            className="bg-accent absolute h-1.5 w-1.5 rounded-full"
            style={{
              left: node.left,
              bottom: node.bottom,
              boxShadow: "0 0 10px 1px var(--color-accent)",
            }}
          />
        ))}
      </div>

      <Container className="relative z-10 pb-28 pt-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="text-ink-2 mt-4 max-w-xs text-sm">
              The AI-powered workspace for email and calendar. Less busywork, more done.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-ink text-sm font-semibold">{column.title}</h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-ink-2 hover:text-ink text-sm transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-line mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <p className="text-ink-3 text-sm">
            © {new Date().getFullYear()} Inboxly. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            {SOCIALS.map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="text-ink-2 hover:bg-surface-hover hover:text-ink grid h-9 w-9 place-items-center rounded-[var(--radius-ctl)] transition-colors"
              >
                <Icon className="h-[18px] w-[18px]" />
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
