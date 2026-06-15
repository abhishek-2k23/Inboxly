"use client";

import { useSignUp } from "@clerk/nextjs";
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
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const loading = fetchStatus === "fetching";
  const disabled = loading || googleLoading;

  async function handleGoogle() {
    setGlobalError(null);
    setGoogleLoading(true);
    sessionStorage.setItem("authFlow", "sign-up");
    const { error } = await signUp.sso({
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

    const toastId = toast.loading("Creating your account…");

    const { error } = await signUp.password({ emailAddress: email, password });
    if (error) {
      toast.error(error.longMessage ?? error.message, toastId);
      setGlobalError(error.longMessage ?? error.message);
      return;
    }

    if (signUp.status === "complete") {
      toast.success("Account created! Redirecting…", toastId);
      await signUp.finalize();
      router.push("/onboarding");
      return;
    }

    if (signUp.unverifiedFields.includes("email_address")) {
      const { error: codeError } = await signUp.verifications.sendEmailCode();
      if (codeError) {
        toast.error(codeError.longMessage ?? codeError.message, toastId);
        setGlobalError(codeError.longMessage ?? codeError.message);
        return;
      }
      toast.success("Check your email for a verification code.", toastId);
      setStep("verify");
      return;
    }

    toast.dismiss(toastId);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);

    const toastId = toast.loading("Verifying…");

    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) {
      toast.error(error.longMessage ?? error.message, toastId);
      setGlobalError(error.longMessage ?? error.message);
      return;
    }

    if (signUp.status === "complete") {
      toast.success("Account created! Redirecting…", toastId);
      await signUp.finalize();
      router.push("/onboarding");
      return;
    }

    toast.dismiss(toastId);
  }

  async function handleResend() {
    setGlobalError(null);
    const { error } = await signUp.verifications.sendEmailCode();
    if (error) {
      toast.error(error.longMessage ?? error.message);
      setGlobalError(error.longMessage ?? error.message);
    } else {
      toast.info("Verification code resent.");
    }
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
          {step === "form" ? (
            <>
              <h1 className="text-ink text-lg font-medium">Create your account</h1>
              <p className="text-ink-2 mt-1 text-sm">Start managing email and calendar with AI.</p>

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
                    error={errors.fields.emailAddress?.message}
                    disabled={disabled}
                    autoFocus
                  />
                  <AuthField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    error={errors.fields.password?.message}
                    disabled={disabled}
                  />
                  <AuthGlobalError message={globalError} />
                  <AuthSubmitButton loading={loading} disabled={disabled}>
                    Create account
                  </AuthSubmitButton>
                </form>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-ink text-lg font-medium">Check your email</h1>
              <p className="text-ink-2 mt-1 text-sm">
                Enter the verification code we sent to {email}.
              </p>

              <form onSubmit={handleVerify} className="mt-6 flex flex-col gap-4">
                <AuthField
                  label="Verification code"
                  value={code}
                  onChange={setCode}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  error={errors.fields.code?.message}
                  autoFocus
                />
                <AuthGlobalError message={globalError} />
                <AuthSubmitButton loading={loading}>Verify &amp; continue</AuthSubmitButton>
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-accent-light hover:text-accent self-center text-xs transition-colors"
                >
                  Resend code
                </button>
              </form>
            </>
          )}
        </AuthCard>
      </div>

      <p className="text-ink-2 relative mt-6 text-sm">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-accent-light hover:text-accent font-medium">
          Sign in
        </Link>
      </p>
    </main>
  );
}
