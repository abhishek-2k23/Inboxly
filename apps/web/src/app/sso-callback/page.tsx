"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { HeroBackground } from "@/components/landing/hero-background";
import {
  AuthCard,
  AuthDivider,
  AuthField,
  AuthSubmitButton,
  GoogleButton,
} from "@/components/auth/auth-ui";
import { useToast } from "@/components/toast";
import { useAuth } from "@/hooks/use-auth";

const COPY: Record<"sign-in" | "sign-up", { title: string; description: string; cta: string }> = {
  "sign-in": {
    title: "Welcome back",
    description: "Sign in to your Inboxly account.",
    cta: "Sign in",
  },
  "sign-up": {
    title: "Create your account",
    description: "Start managing email and calendar with AI.",
    cta: "Create account",
  },
};

export default function Page() {
  const [flow, setFlow] = useState<"sign-in" | "sign-up">("sign-in");

  useEffect(() => {
    if (sessionStorage.getItem("authFlow") === "sign-up") setFlow("sign-up");
  }, []);

  const copy = COPY[flow];

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
          <h1 className="text-ink text-lg font-medium">{copy.title}</h1>
          <p className="text-ink-2 mt-1 text-sm">{copy.description}</p>

          <div className="mt-6 flex flex-col gap-4">
            <GoogleButton onClick={() => {}} disabled loading />
            <AuthDivider />

            <div className="flex flex-col gap-4">
              <AuthField label="Email" value="" onChange={() => {}} disabled />
              <AuthField label="Password" type="password" value="" onChange={() => {}} disabled />
              <AuthSubmitButton disabled>{copy.cta}</AuthSubmitButton>
            </div>
          </div>
        </AuthCard>
      </div>

      <Suspense>
        <CallbackHandler />
      </Suspense>
    </main>
  );
}

function CallbackHandler() {
  const router = useRouter();
  const toast = useToast();
  const { isLoaded, isSignedIn } = useAuth();
  const toastId = useRef<number | null>(null);
  const redirected = useRef(false);

  useEffect(() => {
    const id = toast.loading("Signing you in with Google…");
    toastId.current = id;
    return () => toast.dismiss(id);
  }, [toast]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || redirected.current) return;
    redirected.current = true;

    if (toastId.current !== null) toast.success("Signed in! Redirecting…", toastId.current);
    sessionStorage.removeItem("authFlow");
    router.replace("/onboarding");
  }, [isLoaded, isSignedIn, router, toast]);

  return (
    <AuthenticateWithRedirectCallback
      signInForceRedirectUrl="/onboarding"
      signUpForceRedirectUrl="/onboarding"
    />
  );
}
