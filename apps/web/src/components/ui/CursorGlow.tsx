"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A large, very-soft accent glow that smoothly trails the pointer — ambient
 * "light" that makes the page feel alive. Mounted once on the landing page.
 * Disabled on coarse pointers (touch) and when the user prefers reduced motion.
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reduceMotion) return;
    setEnabled(true);

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    let raf = 0;
    let visible = false;

    const show = (on: boolean) => {
      visible = on;
      if (ref.current) ref.current.style.opacity = on ? "1" : "0";
    };

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!visible) show(true);
    };
    const onLeave = () => show(false);

    const tick = () => {
      // Lerp toward the cursor so the glow trails with a soft, weighty feel.
      pos.x += (target.x - pos.x) * 0.14;
      pos.y += (target.y - pos.y) * 0.14;
      const el = ref.current;
      if (el) el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-30 h-[860px] w-[860px] rounded-full opacity-0 blur-[90px] transition-opacity duration-500"
      style={{
        background: "radial-gradient(circle, var(--cursor-glow), transparent 75%)",
        willChange: "transform",
      }}
    />
  );
}
