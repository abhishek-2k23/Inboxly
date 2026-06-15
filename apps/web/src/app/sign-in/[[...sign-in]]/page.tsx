"use client";

import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HeroBackground } from "@/components/landing/hero-background";
import {
  AuthCard,
  AuthDivider,
  AuthField,
  AuthGlobalError,
  AuthSubmitButton,
  GoogleButton,
} from "@/components/auth/auth-ui";
import { useToast } from "@/components/toast";

export default function Page() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [noAccount, setNoAccount] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const loading = fetchStatus === "fetching";
  const disabled = loading || googleLoading;

  async function handleGoogle() {
    setGlobalError(null);
    setGoogleLoading(true);
    sessionStorage.setItem("authFlow", "sign-in");
    const { error } = await signIn.sso({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectCallbackUrl: "/sso-callback",
    });
    if (error) {
      setGoogleLoading(false);
      setGlobalError(error.longMessage ?? error.message);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    setNoAccount(false);

    const toastId = toast.loading("Signing you in…");

    const { error } = await signIn.password({ identifier: email, password });
    if (error) {
      toast.error(error.longMessage ?? error.message, toastId);
      setGlobalError(error.longMessage ?? error.message);
      return;
    }

    if (signIn.status === "complete") {
      toast.success("Signed in! Redirecting…", toastId);
      await signIn.finalize();
      router.push("/onboarding");
      return;
    }

    if (signIn.isTransferable) {
      toast.dismiss(toastId);
      setNoAccount(true);
      return;
    }

    toast.error("Additional verification is required for this account.", toastId);
    setGlobalError("Additional verification is required for this account.");
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <HeroBackground />

      <Link href="/" className="relative mb-8 flex items-center gap-2" aria-label="Inboxly home">
        <span className="bg-accent-fill text-accent-light flex h-8 w-8 items-center justify-center rounded-[var(--radius-ctl)]">
          <i className="ti ti-sparkles text-lg" aria-hidden />
        </span>
        <span className="text-ink text-base font-medium">Inboxly</span>
      </Link>

      <div className="relative w-full max-w-sm">
        <AuthCard>
          <h1 className="text-ink text-lg font-medium">Welcome back</h1>
          <p className="text-ink-2 mt-1 text-sm">Sign in to your Inboxly account.</p>

          <div className="mt-6 flex flex-col gap-4">
            <GoogleButton onClick={handleGoogle} disabled={loading} loading={googleLoading} />
            <AuthDivider />

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <AuthField
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
                error={errors.fields.identifier?.message}
                disabled={disabled}
                autoFocus
              />
              <AuthField
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.fields.password?.message}
                disabled={disabled}
              />
              {noAccount && (
                <AuthGlobalError message="We couldn't find an account with that email. Try signing up instead." />
              )}
              <AuthGlobalError message={globalError} />
              <AuthSubmitButton loading={loading} disabled={disabled}>
                Sign in
              </AuthSubmitButton>
            </form>
          </div>
        </AuthCard>
      </div>

      <p className="text-ink-2 relative mt-6 text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-accent-light hover:text-accent font-medium">
          Sign up
        </Link>
      </p>
    </main>
  );
}
