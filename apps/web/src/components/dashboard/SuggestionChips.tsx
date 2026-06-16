"use client";

import { ArrowUpRight } from "lucide-react";
import { SUGGESTIONS } from "@/utils/agent-data";

/** The 3 quick-action chips shown beneath the prompt when there's no history. */
export function SuggestionChips({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {SUGGESTIONS.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onPick(suggestion)}
          className="border-line text-ink-2 hover:border-line-strong hover:text-ink hover:bg-surface group inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors"
        >
          {suggestion}
          <ArrowUpRight className="text-ink-3 group-hover:text-ink h-3.5 w-3.5 transition-colors" />
        </button>
      ))}
    </div>
  );
}
