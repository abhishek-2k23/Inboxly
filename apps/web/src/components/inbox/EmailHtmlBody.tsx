"use client";

import DOMPurify from "dompurify";
import { useMemo, useRef, useState } from "react";

const IFRAME_STYLES = `
  :root { color-scheme: light; }
  html, body {
    margin: 0;
    padding: 16px;
    color: #1a1a1a;
    background: #ffffff;
    font: 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    word-wrap: break-word;
    overflow-wrap: anywhere;
  }
  img { max-width: 100%; height: auto; }
  a { color: #3a5fd9; }
  table { max-width: 100%; }
  * { box-sizing: border-box; }
`;

/**
 * Renders sanitized HTML email content inside a fully sandboxed iframe -
 * the sandbox (no `allow-scripts`/`allow-same-origin`) is the real security
 * boundary, DOMPurify just keeps the markup tidy. A fixed light background
 * matches how Gmail itself renders message bodies regardless of app theme,
 * since most HTML email assumes a white canvas.
 */
export function EmailHtmlBody({ html }: { html: string }) {
  const [height, setHeight] = useState(200);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const srcDoc = useMemo(() => {
    const clean = DOMPurify.sanitize(html, {
      WHOLE_DOCUMENT: false,
      FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
      FORBID_ATTR: ["onerror", "onload", "onclick"],
    });
    return `<!doctype html><html><head><meta charset="utf-8"><style>${IFRAME_STYLES}</style></head><body>${clean}</body></html>`;
  }, [html]);

  function onLoad() {
    const doc = iframeRef.current?.contentDocument;
    if (doc?.documentElement) {
      setHeight(doc.documentElement.scrollHeight + 8);
    }
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      onLoad={onLoad}
      sandbox="allow-popups"
      title="Email content"
      className="w-full rounded-xl border border-[#e5e5e5]"
      style={{ height }}
    />
  );
}
