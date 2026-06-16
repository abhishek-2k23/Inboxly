"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reveals `text` progressively (word-by-word) for a streaming-style effect,
 * since the chat API returns the whole reply at once. When `enabled` is false
 * the full text shows immediately. `onDone` fires once the reveal completes.
 */
export function useTypewriter(text: string, enabled: boolean, onDone?: () => void) {
  const [count, setCount] = useState(enabled ? 0 : text.length);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (!enabled) {
      setCount(text.length);
      return;
    }

    setCount(0);
    let i = 0;
    // Step by a few characters per tick — fast enough to feel live, slow
    // enough to read as "typing".
    const STEP = 3;
    const interval = setInterval(() => {
      i = Math.min(i + STEP, text.length);
      setCount(i);
      if (i >= text.length) {
        clearInterval(interval);
        doneRef.current?.();
      }
    }, 16);

    return () => clearInterval(interval);
  }, [text, enabled]);

  return {
    shown: enabled ? text.slice(0, count) : text,
    done: count >= text.length,
  };
}
