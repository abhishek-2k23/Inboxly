"use client";

import { useUser } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { cn, initials } from "@/lib/ui";

export default function ProfilePage() {
  const { user } = useUser();
  const plan = useSubscriptionStore((s) => s.data?.subscriptionType) ?? "free";

  const name = user?.fullName ?? user?.firstName ?? "Your account";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="animate-rise-in space-y-7">
      <SpotlightCard className="flex items-center gap-4 p-5">
        {user?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.imageUrl}
            alt={name}
            className="bg-surface h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <span className="bg-accent text-accent-ink grid h-16 w-16 place-items-center rounded-full text-lg font-semibold">
            {initials(name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-ink truncate text-lg font-semibold">{name}</h2>
          {email && <p className="text-ink-2 truncate text-sm">{email}</p>}
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
            plan === "pro" ? "bg-accent text-accent-ink" : "bg-surface text-ink-2 hairline",
          )}
        >
          {plan === "pro" && <Sparkles className="h-3 w-3" />}
          {plan === "pro" ? "Pro" : "Free plan"}
        </span>
      </SpotlightCard>

      <SpotlightCard className="p-5">
        <p className="text-ink-3 text-xs font-medium uppercase tracking-[0.08em]">
          Account details
        </p>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-ink-2">Full name</dt>
            <dd className="text-ink font-medium">{name}</dd>
          </div>
          <div className="border-line-subtle flex items-center justify-between border-t pt-3">
            <dt className="text-ink-2">Email</dt>
            <dd className="text-ink font-medium">{email || "—"}</dd>
          </div>
          <div className="border-line-subtle flex items-center justify-between border-t pt-3">
            <dt className="text-ink-2">Plan</dt>
            <dd className="text-ink font-medium capitalize">{plan}</dd>
          </div>
          {joined && (
            <div className="border-line-subtle flex items-center justify-between border-t pt-3">
              <dt className="text-ink-2">Member since</dt>
              <dd className="text-ink font-medium">{joined}</dd>
            </div>
          )}
        </dl>
      </SpotlightCard>
    </div>
  );
}
