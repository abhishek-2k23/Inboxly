"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/ui";
import { IconButton } from "@/components/ui";

const SHORTCUTS: Array<{ keys: string; action: string }> = [
  { keys: "⌘/Ctrl K", action: "Open prompt bar" },
  { keys: "C", action: "Compose / focus prompt" },
  { keys: "/", action: "Focus search" },
  { keys: "J / K", action: "Next / previous email" },
  { keys: "R", action: "Reply" },
  { keys: "E", action: "Archive" },
  { keys: "G then T", action: "Go to chat" },
  { keys: "G then I", action: "Go to inbox" },
  { keys: "G then C", action: "Go to calendar" },
  { keys: "G then S", action: "Go to settings" },
  { keys: "?", action: "Show all shortcuts" },
];

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

/**
 * Global keyboard-first navigation layer. Handles the `G _` chords, `/` search
 * focus, `C` compose, and the `?` shortcut overlay. Per-list shortcuts (J/K/R/E)
 * are owned by the inbox itself; this also renders a dismissible hint bar.
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [awaitingG, setAwaitingG] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target)) {
        if (e.key === "Escape") (e.target as HTMLElement).blur();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (awaitingG) {
        setAwaitingG(false);
        if (e.key === "t") router.push("/app/chat");
        else if (e.key === "i") router.push("/app/inbox");
        else if (e.key === "c") router.push("/app/calendar");
        else if (e.key === "s") router.push("/app/settings");
        return;
      }

      switch (e.key) {
        case "g":
          setAwaitingG(true);
          window.setTimeout(() => setAwaitingG(false), 1200);
          break;
        case "?":
          setShowAll((v) => !v);
          break;
        case "/":
          e.preventDefault();
          window.dispatchEvent(new Event("inboxly:focus-search"));
          break;
        case "c":
          e.preventDefault();
          window.dispatchEvent(new Event("inboxly:focus-prompt"));
          break;
        case "Escape":
          setShowAll(false);
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [awaitingG, router]);

  return (
    <>
      {!hintDismissed && (
        <div className="bg-surface/95 text-ink-3 hairline pointer-events-none fixed bottom-3 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full px-3 py-1.5 text-xs">
          <span className="pointer-events-auto flex items-center gap-3">
            <Hint k="⌘K" label="prompt" />
            <Hint k="/" label="search" />
            <Hint k="J K" label="move" />
            <Hint k="?" label="all" />
          </span>
          <button
            type="button"
            onClick={() => setHintDismissed(true)}
            aria-label="Dismiss shortcuts hint"
            className="text-ink-3 hover:text-ink pointer-events-auto"
          >
            <i className="ti ti-x" aria-hidden />
          </button>
        </div>
      )}

      {showAll && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowAll(false)}
        >
          <div
            className="bg-panel hairline w-full max-w-md rounded-[var(--radius-card)] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-ink flex items-center gap-2 text-sm font-medium">
                <i className="ti ti-keyboard text-accent-light" aria-hidden />
                Keyboard shortcuts
              </h2>
              <IconButton icon="ti-x" label="Close" size="sm" onClick={() => setShowAll(false)} />
            </div>
            <ul className="flex flex-col gap-2">
              {SHORTCUTS.map((s) => (
                <li key={s.keys} className="flex items-center justify-between text-sm">
                  <span className="text-ink-2">{s.action}</span>
                  <kbd className="bg-surface text-ink hairline rounded-[var(--radius-ctl)] px-2 py-0.5 text-xs">
                    {s.keys}
                  </kbd>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

function Hint({ k, label }: { k: string; label: string }) {
  return (
    <span className={cn("flex items-center gap-1")}>
      <kbd className="bg-page text-ink-2 hairline rounded px-1.5 py-0.5">{k}</kbd>
      <span>{label}</span>
    </span>
  );
}
