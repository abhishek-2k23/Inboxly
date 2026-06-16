"use client";

import { AlertCircle, Check, Info, X } from "lucide-react";
import { create } from "zustand";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/ui";

type ToastType = "loading" | "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (type: ToastType, message: string, id?: number) => number;
  dismiss: (id: number) => void;
}

let nextId = 1;
const AUTO_DISMISS: Record<ToastType, number | null> = {
  loading: null,
  success: 3500,
  error: 5000,
  info: 3500,
};

const timers = new Map<number, ReturnType<typeof setTimeout>>();

const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (type, message, id) => {
    const toastId = id ?? nextId++;
    const existing = timers.get(toastId);
    if (existing) {
      clearTimeout(existing);
      timers.delete(toastId);
    }

    set((state) => {
      const next = state.toasts.some((t) => t.id === toastId)
        ? state.toasts.map((t) => (t.id === toastId ? { ...t, type, message } : t))
        : [...state.toasts, { id: toastId, type, message }];
      return { toasts: next };
    });

    const ttl = AUTO_DISMISS[type];
    if (ttl !== null) {
      timers.set(
        toastId,
        setTimeout(() => get().dismiss(toastId), ttl),
      );
    }
    return toastId;
  },
  dismiss: (id) => {
    const t = timers.get(id);
    if (t) {
      clearTimeout(t);
      timers.delete(id);
    }
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
  },
}));

/**
 * Imperative toast API. `loading()` returns an id you can pass back to
 * `success()`/`error()` to morph the same toast in place (e.g. "Syncing…" →
 * "Synced 12 events").
 */
export function useToast() {
  const push = useToastStore((s) => s.push);
  const dismiss = useToastStore((s) => s.dismiss);
  return {
    loading: (message: string, id?: number) => push("loading", message, id),
    success: (message: string, id?: number) => push("success", message, id),
    error: (message: string, id?: number) => push("error", message, id),
    info: (message: string, id?: number) => push("info", message, id),
    dismiss,
  };
}

const ICON: Record<ToastType, React.ReactNode> = {
  loading: <Spinner className="text-accent h-4 w-4" />,
  success: <Check className="text-success h-4 w-4" />,
  error: <AlertCircle className="text-danger h-4 w-4" />,
  info: <Info className="text-ink-2 h-4 w-4" />,
};

/** Mount once (in Providers). Renders the live toast stack, bottom-right. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "animate-toast-in bg-panel hairline pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3",
            "shadow-[0_16px_40px_-20px_rgba(0,0,0,0.45)]",
          )}
          role="status"
        >
          <span className="mt-0.5 shrink-0">{ICON[toast.type]}</span>
          <p className="text-ink flex-1 text-sm leading-snug">{toast.message}</p>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => dismiss(toast.id)}
            className="text-ink-3 hover:text-ink -mr-1 mt-0.5 shrink-0 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
