import { ClerkLoaded, ClerkLoading, SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { AuthLoader } from "@/components/auth/auth-loader";
import { HeroBackground } from "@/components/landing/hero-background";

export default function Page() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <HeroBackground />

      <Link href="/" className="relative mb-8 flex items-center gap-2" aria-label="Inboxly home">
        <span className="bg-accent-fill text-accent-light flex h-8 w-8 items-center justify-center rounded-[var(--radius-ctl)]">
          <i className="ti ti-sparkles text-lg" aria-hidden />
        </span>
        <span className="text-ink text-base font-medium">Inboxly</span>
      </Link>

      <div className="relative">
        <ClerkLoading>
          <AuthLoader />
        </ClerkLoading>
        <ClerkLoaded>
          <SignIn forceRedirectUrl="/app/chat" signUpUrl="/sign-up" />
        </ClerkLoaded>
      </div>
    </main>
  );
}
