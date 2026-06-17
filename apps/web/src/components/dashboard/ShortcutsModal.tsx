"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface ShortcutRow {
  keys: string[];
  label: string;
}

interface ShortcutGroup {
  title: string;
  items: ShortcutRow[];
}

const GROUPS: ShortcutGroup[] = [
  {
    title: "Navigation",
    items: [
      { keys: ["A"], label: "AI Agent" },
      { keys: ["I"], label: "Inbox" },
      { keys: ["S"], label: "Sent" },
      { keys: ["D"], label: "Drafts" },
      { keys: ["R"], label: "Archive" },
      { keys: ["C"], label: "Calendar" },
      { keys: ["B"], label: "Billing" },
    ],
  },
  {
    title: "Actions",
    items: [
      { keys: ["Ctrl", "N"], label: "New chat" },
      { keys: ["E"], label: "Compose email (Inbox pages)" },
      { keys: ["Ctrl", "J"], label: "Draft with AI (Compose)" },
      { keys: ["\\"], label: "Toggle sidebar" },
      { keys: ["Ctrl", ","], label: "Settings" },
    ],
  },
  {
    title: "General",
    items: [
      { keys: ["?"], label: "Show / hide shortcuts" },
      { keys: ["Esc"], label: "Close this panel" },
    ],
  },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="bg-surface border-line text-ink-2 inline-flex h-6 min-w-6 items-center justify-center rounded border px-1.5 font-mono text-[11px] font-medium">
      {children}
    </kbd>
  );
}

function Keys({ keys }: { keys: string[] }) {
  return (
    <span className="flex items-center gap-1">
      {keys.map((k, i) => (
        <span key={i} className="flex items-center gap-1">
          <Kbd>{k}</Kbd>
          {i < keys.length - 1 && <span className="text-ink-3 text-[10px]">+</span>}
        </span>
      ))}
    </span>
  );
}

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Close on Escape (belt-and-suspenders — hook also handles it)
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="bg-panel border-line relative w-full max-w-lg rounded-2xl border shadow-2xl">
        {/* Header */}
        <div className="border-line flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-ink text-sm font-semibold">Keyboard shortcuts</h2>
            <p className="text-ink-3 mt-0.5 text-xs">
              Shortcuts are disabled while typing in a field.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-3 hover:text-ink hover:bg-surface-hover grid h-7 w-7 place-items-center rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div
          className="divide-line divide-y overflow-y-auto"
          style={{ maxHeight: "min(60vh, 480px)" }}
        >
          {GROUPS.map((group) => (
            <div key={group.title} className="px-5 py-4">
              <p className="text-ink-3 mb-3 text-[11px] font-semibold uppercase tracking-widest">
                {group.title}
              </p>
              <ul className="space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-4">
                    <span className="text-ink-2 text-sm">{item.label}</span>
                    <Keys keys={item.keys} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="border-line border-t px-5 py-3">
          <p className="text-ink-3 text-xs">
            Press <Kbd>?</Kbd> anytime to toggle this panel.
          </p>
        </div>
      </div>
    </div>
  );
}
