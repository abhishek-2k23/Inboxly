import { marked } from "marked";

marked.setOptions({ breaks: true, gfm: true });

// Gmail strips <style> blocks, so we post-process the rendered HTML to inject
// inline styles on each element. Regex replacement is simpler and more reliable
// than a custom Renderer (whose method signatures change across marked versions).
const STYLE_MAP: [RegExp, string][] = [
  [
    /<h1>/g,
    `<h1 style="margin:16px 0 6px;font-size:20px;font-weight:600;color:#1a1a1e;line-height:1.3">`,
  ],
  [
    /<h2>/g,
    `<h2 style="margin:14px 0 5px;font-size:17px;font-weight:600;color:#1a1a1e;line-height:1.3">`,
  ],
  [
    /<h3>/g,
    `<h3 style="margin:12px 0 4px;font-size:15px;font-weight:600;color:#1a1a1e;line-height:1.3">`,
  ],
  [
    /<h4>/g,
    `<h4 style="margin:10px 0 4px;font-size:14px;font-weight:600;color:#1a1a1e;line-height:1.3">`,
  ],
  [
    /<p>/g,
    `<p style="margin:8px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1e">`,
  ],
  [
    /<ul>/g,
    `<ul style="margin:8px 0;padding-left:22px;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1e">`,
  ],
  [
    /<ol>/g,
    `<ol style="margin:8px 0;padding-left:22px;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1e">`,
  ],
  [
    /<li>/g,
    `<li style="margin:4px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1e">`,
  ],
  [/<strong>/g, `<strong style="font-weight:600;color:#1a1a1e">`],
  [/<em>/g, `<em style="font-style:italic;color:#4a4a52">`],
  [
    /<blockquote>/g,
    `<blockquote style="margin:10px 0;padding:6px 12px;border-left:3px solid #4f7cff;color:#4a4a52;font-style:italic">`,
  ],
  [
    /<table>/g,
    `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;border:1px solid #dcdce0">`,
  ],
  [/<thead>/g, `<thead style="background:#f4f4f6">`],
  [
    /<th>/g,
    `<th style="padding:8px 12px;text-align:left;font-weight:600;color:#1a1a1e;border-bottom:2px solid #dcdce0">`,
  ],
  [
    /<td>/g,
    `<td style="padding:8px 12px;border-bottom:1px solid #ebebef;color:#2a2a2e;vertical-align:top">`,
  ],
  [
    /<pre>/g,
    `<pre style="background:#f4f4f6;border:1px solid #dcdce0;border-radius:6px;padding:12px 14px;overflow-x:auto;margin:10px 0">`,
  ],
  [/<code>/g, `<code style="font-family:'SF Mono',Monaco,Consolas,monospace;font-size:12px">`],
  [/<a /g, `<a style="color:#4f7cff;text-decoration:underline" `],
  [/<hr>/g, `<hr style="border:none;border-top:1px solid #dcdce0;margin:14px 0">`],
];

function inlineStyles(html: string): string {
  let out = html;
  for (const [pattern, replacement] of STYLE_MAP) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/** Converts LLM-authored Markdown to Gmail-compatible HTML with inline styles. */
export function markdownToHtml(markdown: string): string {
  const raw = marked.parse(markdown, { async: false }) as string;
  const styled = inlineStyles(raw);
  return (
    `<div style="font-family:Inter,Arial,sans-serif;font-size:14px;` +
    `line-height:1.6;color:#1a1a1e;padding:4px 0">` +
    styled +
    `</div>`
  );
}
