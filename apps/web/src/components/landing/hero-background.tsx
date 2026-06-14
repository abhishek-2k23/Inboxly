"use client";

import { useEffect, useRef } from "react";

/**
 * Subtle grid texture + a soft accent glow that follows the cursor. The glow
 * brightens on mouse movement and settles back down when idle — pure CSS/DOM,
 * no React state, so it doesn't trigger re-renders.
 */
export function HeroBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const glow = glowRef.current;
    if (!container || !glow) return;

    let fadeTimer: ReturnType<typeof setTimeout>;

    function onMove(e: MouseEvent) {
      const rect = container!.getBoundingClientRect();
      glow!.style.transform = `translate(${e.clientX - rect.left}px, ${e.clientY - rect.top}px)`;
      glow!.style.opacity = "0.18";
      clearTimeout(fadeTimer);
      fadeTimer = setTimeout(() => {
        glow!.style.opacity = "0.4";
      }, 400);
    }

    container.addEventListener("mousemove", onMove);
    return () => {
      container.removeEventListener("mousemove", onMove);
      clearTimeout(fadeTimer);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-line) 1px, transparent 1px), linear-gradient(to bottom, var(--color-line) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "linear-gradient(to bottom, black, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          opacity: 0.6,
        }}
      />
      <div
        ref={glowRef}
        className="bg-accent pointer-events-none absolute -ml-32 -mt-32 h-64 w-64 rounded-full opacity-40 blur-[90px] transition-opacity duration-700 ease-out"
      />
    </div>
  );
}
