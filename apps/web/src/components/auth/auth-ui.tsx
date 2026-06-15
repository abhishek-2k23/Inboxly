"use client";

import { ThinkingDots } from "@/components/ui";
import { cn } from "@/lib/ui";

/** Branded card shell shared by the auth screens. */
export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-panel hairline relative w-full rounded-[var(--radius-card)] p-8">
      {children}
    </div>
  );
}

export function AuthField({
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  autoFocus,
  disabled,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-ink-2 text-xs">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        disabled={disabled}
        className={cn(
          "bg-surface text-ink placeholder:text-ink-3 w-full rounded-[var(--radius-ctl)] px-3 py-2 text-sm outline-none transition-colors disabled:opacity-60",
          error ? "hairline border-prio-urgent" : "hairline focus:border-accent",
        )}
      />
      {error && <span className="text-prio-urgent text-xs">{error}</span>}
    </label>
  );
}

export function AuthSubmitButton({
  children,
  loading,
  disabled,
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="bg-accent text-accent-ink hover:bg-accent-light flex w-full items-center justify-center gap-2 rounded-[var(--radius-ctl)] px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
    >
      {loading ? <ThinkingDots /> : children}
    </button>
  );
}

/** Inline Google "G" mark — Tabler's icon set has no brand icons. */
export function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}

export function GoogleButton({
  onClick,
  disabled,
  loading,
  loadingLabel = "Signing in with Google…",
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="bg-surface hairline hover:bg-surface-hover text-ink flex w-full items-center justify-center gap-2 rounded-[var(--radius-ctl)] px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
    >
      {loading ? (
        <>
          <i className="ti ti-loader-2 animate-spin" aria-hidden />
          {loadingLabel}
        </>
      ) : (
        <>
          <GoogleIcon />
          Continue with Google
        </>
      )}
    </button>
  );
}

export function AuthGlobalError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="bg-surface text-prio-urgent hairline flex items-center gap-2 rounded-[var(--radius-ctl)] px-3 py-2 text-xs">
      <i className="ti ti-alert-circle" aria-hidden />
      {message}
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3">
      <span className="bg-line h-px flex-1" />
      <span className="text-ink-3 text-xs">or</span>
      <span className="bg-line h-px flex-1" />
    </div>
  );
}
