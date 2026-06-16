"use client";

import { CAPABILITIES } from "@/utils/agent-data";

/** 2x2 discovery grid shown on the empty AI Agent view. Clicking a card prefills the prompt. */
export function FeatureGrid({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
      {CAPABILITIES.map(({ icon: Icon, title, description, prompt }) => (
        <button
          key={title}
          type="button"
          onClick={() => onPick(prompt)}
          className="border-line bg-panel hover:border-line-strong hover:bg-surface group flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors"
        >
          <span className="text-ink-3 group-hover:text-ink flex items-center gap-2 transition-colors">
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <span className="text-ink text-sm font-medium">{title}</span>
          <span className="text-ink-2 text-xs leading-relaxed">{description}</span>
        </button>
      ))}
    </div>
  );
}
