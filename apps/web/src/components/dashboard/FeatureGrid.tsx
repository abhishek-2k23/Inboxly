"use client";

import { useState } from "react";
import { CAPABILITIES } from "@/utils/agent-data";

const CARD_COLORS = [
  {
    iconColor: "#a78bfa",
    iconBg: "rgba(139,92,246,0.18)",
    border: "rgba(139,92,246,0.28)",
    hoverBorder: "rgba(139,92,246,0.65)",
    bg: "linear-gradient(145deg,rgba(139,92,246,0.1) 0%,rgba(139,92,246,0.03) 100%)",
    glow: "0 4px 12px -4px rgba(139,92,246,0.45), 0 0 0 1px rgba(139,92,246,0.65)",
    labelColor: "#c4b5fd",
  },
  {
    iconColor: "#60a5fa",
    iconBg: "rgba(59,130,246,0.18)",
    border: "rgba(59,130,246,0.28)",
    hoverBorder: "rgba(59,130,246,0.65)",
    bg: "linear-gradient(145deg,rgba(59,130,246,0.1) 0%,rgba(59,130,246,0.03) 100%)",
    glow: "0 4px 12px -4px rgba(59,130,246,0.45), 0 0 0 1px rgba(59,130,246,0.65)",
    labelColor: "#93c5fd",
  },
  {
    iconColor: "#34d399",
    iconBg: "rgba(16,185,129,0.18)",
    border: "rgba(16,185,129,0.28)",
    hoverBorder: "rgba(16,185,129,0.65)",
    bg: "linear-gradient(145deg,rgba(16,185,129,0.1) 0%,rgba(16,185,129,0.03) 100%)",
    glow: "0 4px 12px -4px rgba(16,185,129,0.45), 0 0 0 1px rgba(16,185,129,0.65)",
    labelColor: "#6ee7b7",
  },
  {
    iconColor: "#fb7185",
    iconBg: "rgba(244,63,94,0.18)",
    border: "rgba(244,63,94,0.28)",
    hoverBorder: "rgba(244,63,94,0.65)",
    bg: "linear-gradient(145deg,rgba(244,63,94,0.1) 0%,rgba(244,63,94,0.03) 100%)",
    glow: "0 4px 12px -4px rgba(244,63,94,0.45), 0 0 0 1px rgba(244,63,94,0.65)",
    labelColor: "#fda4af",
  },
];

export function FeatureGrid({ onPick }: { onPick: (prompt: string) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
      {CAPABILITIES.map(({ icon: Icon, title, description, prompt }, i) => {
        const c = CARD_COLORS[i]!;
        const isHovered = hovered === i;

        return (
          <button
            key={title}
            type="button"
            onClick={() => onPick(prompt)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: c.bg,
              borderColor: isHovered ? c.hoverBorder : c.border,
              boxShadow: isHovered ? c.glow : "none",
              transform: isHovered ? "translateY(-2px) scale(1.01)" : "none",
            }}
            className="relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300"
          >
            {/* Icon badge */}
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
              style={{ background: c.iconBg }}
            >
              <Icon className="h-[18px] w-[18px]" style={{ color: c.iconColor }} />
            </span>

            <span className="flex flex-col gap-1">
              <span
                className="text-sm font-semibold"
                style={{ color: isHovered ? c.labelColor : undefined }}
              >
                {title}
              </span>
              <span className="text-ink-2 text-xs leading-relaxed">{description}</span>
            </span>

            {/* Subtle top-left glow streak */}
            <span
              className="pointer-events-none absolute left-0 top-0 h-px w-1/2 rounded-full opacity-60 transition-opacity duration-300"
              style={{
                background: `linear-gradient(90deg, ${c.iconColor}, transparent)`,
                opacity: isHovered ? 0.8 : 0.3,
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
