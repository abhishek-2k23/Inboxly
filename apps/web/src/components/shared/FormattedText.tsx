import { Fragment, type ReactNode } from "react";

const URL_RE = /(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)/gi;
const EMAIL_RE = /([\w.+-]+@[\w-]+\.[a-zA-Z]{2,})/g;
const TRAILING_PUNCT = /[.,;:!?'")\]]+$/;

/** Splits trailing sentence punctuation off a matched URL so "...site.com." doesn't link the period. */
function stripTrailing(token: string): [clean: string, trail: string] {
  const m = token.match(TRAILING_PUNCT);
  if (!m) return [token, ""];
  return [token.slice(0, -m[0].length), m[0]];
}

function linkifyEmails(segment: string, key: string): ReactNode[] {
  if (!segment) return [];
  const parts = segment.split(EMAIL_RE);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <a
        key={`${key}-e${i}`}
        href={`mailto:${part}`}
        className="text-accent hover:text-accent-light underline underline-offset-2"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

/** Turns bare URLs and email addresses in a single line of plain text into clickable links. */
function linkifyLine(line: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const parts = line.split(URL_RE);
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      const [clean, trail] = stripTrailing(part);
      const href = clean.startsWith("www.") ? `https://${clean}` : clean;
      out.push(
        <a
          key={`${key}-u${i}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:text-accent-light underline underline-offset-2"
        >
          {clean}
        </a>,
      );
      if (trail) out.push(trail);
    } else {
      out.push(...linkifyEmails(part, `${key}-${i}`));
    }
  });
  return out;
}

/** A short, unpunctuated standalone line reads as a heading rather than prose. */
function isHeadingLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 70) return false;
  if (/[.?!,;:]$/.test(trimmed)) return false;
  return true;
}

/**
 * Renders plain-text content (email bodies, event descriptions) with basic
 * structure: blank-line-separated paragraphs, short standalone lines
 * promoted to headings, and bare URLs/emails turned into real links. Builds
 * React nodes directly (no dangerouslySetInnerHTML) since the input is
 * untrusted third-party text.
 */
export function FormattedText({ text }: { text: string }) {
  const trimmed = text.replace(/\r\n/g, "\n").trim();
  if (!trimmed) return null;
  const paragraphs = trimmed.split(/\n{2,}/);

  return (
    <div className="space-y-3">
      {paragraphs.map((para, pi) => {
        const lines = para.split("\n");
        if (lines.length === 1 && isHeadingLine(lines[0] ?? "")) {
          return (
            <p key={pi} className="text-ink mt-5 text-[0.95rem] font-semibold first:mt-0">
              {linkifyLine(lines[0]?.trim() ?? "", `h${pi}`)}
            </p>
          );
        }
        return (
          <p key={pi} className="text-ink-2 text-sm leading-relaxed">
            {lines.map((line, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {linkifyLine(line, `p${pi}-${li}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
