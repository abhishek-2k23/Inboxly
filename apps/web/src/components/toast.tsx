"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/ui";
import { ThinkingDots } from "@/components/ui";

type ToastKind = "loading" | "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  /** Show a persistent loading toast; returns its id to update later. */
  loading: (message: string) => number;
  success: (message: string, id?: number) => number;
  error: (message: string, id?: number) => number;
  info: (message: string, id?: number) => number;
  dismiss: (id: number) => void;
  /** Wrap a promise: loading → success/error, reusing one toast. */
  promise: <T>(
    p: Promise<T>,
    msgs: { loading: string; success: string | ((v: T) => string); error: string },
  ) => Promise<T>;
}

const ToastContext = createContext<ToastApi | null>(null);

const AUTO_DISMISS: Record<ToastKind, number | null> = {
  loading: null,
  success: 3000,
  error: 5000,
  info: 3500,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const schedule = useCallback(
    (id: number, kind: ToastKind) => {
      const existing = timers.current.get(id);
      if (existing) clearTimeout(existing);
      const delay = AUTO_DISMISS[kind];
      if (delay !== null) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), delay),
        );
      }
    },
    [dismiss],
  );

  const upsert = useCallback(
    (kind: ToastKind, message: string, id?: number): number => {
      const tid = id ?? ++idRef.current;
      setToasts((prev) => {
        const exists = prev.some((t) => t.id === tid);
        if (exists) return prev.map((t) => (t.id === tid ? { ...t, kind, message } : t));
        return [...prev, { id: tid, kind, message }];
      });
      schedule(tid, kind);
      return tid;
    },
    [schedule],
  );

  const api = useMemo<ToastApi>(() => {
    const loading = (message: string) => upsert("loading", message);
    const success = (message: string, id?: number) => upsert("success", message, id);
    const error = (message: string, id?: number) => upsert("error", message, id);
    const info = (message: string, id?: number) => upsert("info", message, id);
    return {
      loading,
      success,
      error,
      info,
      dismiss,
      promise: async (p, msgs) => {
        const id = loading(msgs.loading);
        try {
          const v = await p;
          success(typeof msgs.success === "function" ? msgs.success(v) : msgs.success, id);
          return v;
        } catch (e) {
          error(msgs.error, id);
          throw e;
        }
      },
    };
  }, [upsert, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const ICON: Record<ToastKind, string> = {
  loading: "",
  success: "ti-circle-check",
  error: "ti-alert-triangle",
  info: "ti-info-circle",
};

const ACCENT: Record<ToastKind, string> = {
  loading: "text-accent-light",
  success: "text-accent-light",
  error: "text-prio-urgent",
  info: "text-ink-2",
};

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-in bg-panel hairline pointer-events-auto flex items-center gap-3 rounded-[var(--radius-ctl)] px-3 py-2.5"
        >
          {t.kind === "loading" ? (
            <ThinkingDots />
          ) : (
            <i className={cn("ti shrink-0", ICON[t.kind], ACCENT[t.kind])} aria-hidden />
          )}
          <span className="text-ink min-w-0 flex-1 text-sm">{t.message}</span>
          {t.kind !== "loading" && (
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
              className="text-ink-3 hover:text-ink shrink-0"
            >
              <i className="ti ti-x" aria-hidden />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
