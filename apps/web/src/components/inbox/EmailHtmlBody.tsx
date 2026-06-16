"use client";

import DOMPurify from "dompurify";
import { useEffect, useMemo, useRef, useState } from "react";

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

function BodyShimmer() {
  return (
    <div className="space-y-2.5 rounded-xl border border-[#e5e5e5] p-4">
      <div className="bg-surface-hover h-3.5 w-full animate-pulse rounded" />
      <div className="bg-surface-hover h-3.5 w-11/12 animate-pulse rounded" />
      <div className="bg-surface-hover h-3.5 w-4/5 animate-pulse rounded" />
      <div className="bg-surface-hover mt-4 h-40 w-full animate-pulse rounded-lg" />
    </div>
  );
}

/**
 * Renders sanitized HTML email content inside a fully sandboxed iframe -
 * the sandbox (no `allow-scripts`) is the real security boundary, DOMPurify
 * just keeps the markup tidy. `allow-same-origin` is included only so the
 * parent can read `contentDocument` to measure height; with no script
 * execution allowed there's nothing that could abuse same-origin DOM access.
 * A fixed light background matches how Gmail itself renders message bodies
 * regardless of app theme, since most HTML email assumes a white canvas.
 */
export function EmailHtmlBody({ html }: { html: string }) {
  const [height, setHeight] = useState(0);
  const [ready, setReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const srcDoc = useMemo(() => {
    const clean = DOMPurify.sanitize(html, {
      WHOLE_DOCUMENT: false,
      FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
      FORBID_ATTR: ["onerror", "onload", "onclick"],
    });
    return `<!doctype html><html><head><meta charset="utf-8"><style>${IFRAME_STYLES}</style></head><body>${clean}</body></html>`;
  }, [html]);

  // Measures on load and keeps watching afterwards, so the iframe always
  // fits its content exactly even as it settles (images arriving async,
  // fonts swapping in). The shimmer covers it until the first measurement
  // lands, so it never flashes as a tiny clipped box.
  function measure() {
    const root = iframeRef.current?.contentDocument?.documentElement;
    if (!root) return;
    setHeight(root.scrollHeight + 8);
    setReady(true);
    if (!observerRef.current && typeof ResizeObserver !== "undefined") {
      observerRef.current = new ResizeObserver(measure);
      observerRef.current.observe(root);
    }
  }

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="relative">
      {!ready && <BodyShimmer />}
      <iframe
        ref={iframeRef}
        srcDoc={srcDoc}
        onLoad={measure}
        sandbox="allow-popups allow-same-origin"
        title="Email content"
        className={
          ready
            ? "w-full rounded-xl border border-[#e5e5e5]"
            : "invisible absolute left-0 top-0 w-full"
        }
        style={{ height: ready ? height : 0 }}
      />
    </div>
  );
}
