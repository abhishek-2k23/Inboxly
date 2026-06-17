"use client";

import { ArrowUpRight } from "lucide-react";
import { SUGGESTIONS } from "@/utils/agent-data";

const CHIP_COLORS = [
  {
    border: "rgba(139,92,246,0.3)",
    hoverBorder: "rgba(139,92,246,0.7)",
    hoverText: "#c4b5fd",
    dot: "#8b5cf6",
  },
  {
    border: "rgba(6,182,212,0.3)",
    hoverBorder: "rgba(6,182,212,0.7)",
    hoverText: "#67e8f9",
    dot: "#06b6d4",
  },
  {
    border: "rgba(236,72,153,0.3)",
    hoverBorder: "rgba(236,72,153,0.7)",
    hoverText: "#f9a8d4",
    dot: "#ec4899",
  },
];

export function SuggestionChips({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {SUGGESTIONS.map((suggestion, i) => {
        const c = CHIP_COLORS[i % CHIP_COLORS.length]!;
        return (
          <button
            key={suggestion}
            type="button"
            onClick={() => onPick(suggestion)}
            style={{ borderColor: c.border }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = c.hoverBorder;
              el.style.color = c.hoverText;
              el.style.boxShadow = `0 0 12px -2px ${c.dot}55`;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = c.border;
              el.style.color = "";
              el.style.boxShadow = "";
            }}
            className="text-ink-2 group inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-200"
          >
            {suggestion}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        );
      })}
    </div>
  );
}
