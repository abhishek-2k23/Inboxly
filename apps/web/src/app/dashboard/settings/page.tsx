"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import {
  Activity,
  AlertTriangle,
  Check,
  MessageSquare,
  MessagesSquare,
  Plug,
  RefreshCw,
  Sparkles,
  Unplug,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { GoogleIntegrationPlugin } from "@repo/shared";
import { INTEGRATION_META, tintStyle } from "@/components/dashboard/ConnectPrompt";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { useAuth } from "@/hooks/use-auth";
import { useGoogleConnect } from "@/hooks/use-google-connect";
import { deleteAccount, disconnectIntegration } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { cn, initials } from "@/lib/ui";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "usage", label: "Usage", icon: Activity },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle },
] as const;

export default function SettingsPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  const load = useSubscriptionStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  // Highlight the section nearest the top of the scroll viewport as the user
  // scrolls, and let the left-rail links scroll to a section on click.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { root, rootMargin: "0px 0px -55% 0px", threshold: 0 },
    );
    for (const { id } of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <header className="animate-rise-in">
          <h1 className="text-ink text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-ink-2 mt-1.5 text-sm">Manage your account and connected apps.</p>
        </header>

        <div className="mt-8 flex items-start gap-10">
          {/* <aside className="animate-rise-in sticky top-8 hidden w-44 shrink-0 md:block">
            <nav className="-mt-2 flex flex-col gap-0.5">
              {SECTIONS.map((s) => {
                const isActive = active === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => scrollTo(s.id)}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-surface text-ink font-medium"
                        : "text-ink-2 hover:bg-surface hover:text-ink",
                    )}
                  >
                    {isActive && (
                      <span className="bg-accent absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full" />
                    )}
                    <s.icon className="h-[18px] w-[18px] shrink-0" />
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </aside> */}

          {/* Stacked sections */}
          <div className="min-w-0 flex-1 space-y-12">
            <Section
              id="profile"
              title="Profile"
              description="How your account appears in Inboxly."
            >
              <ProfileSection />
            </Section>

            <Section
              id="integrations"
              title="Integrations"
              description="Manage the Google services Inboxly can access."
            >
              <IntegrationsSection />
            </Section>

            <Section
              id="usage"
              title="Usage"
              description="Your activity against this month's allowance."
            >
              <UsageSection />
            </Section>

            <Section
              id="danger"
              title="Danger Zone"
              description="Irreversible actions that affect your account permanently."
            >
              <DangerSection />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-10">
      <div className="animate-rise-in">
        <h2 className="text-ink text-base font-semibold">{title}</h2>
        <p className="text-ink-2 mt-1 text-sm">{description}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/* ------------------------------- Profile ------------------------------- */

function ProfileSection() {
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
    <div className="space-y-4">
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
          <h3 className="text-ink truncate text-lg font-semibold">{name}</h3>
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

/* ----------------------------- Integrations ---------------------------- */

const PLUGINS: GoogleIntegrationPlugin[] = ["gmail", "googlecalendar"];

function IntegrationsSection() {
  const { gmailConnected, calendarConnected } = useAuth();
  const { connecting, connect } = useGoogleConnect();
  const setIntegration = useAuthStore((s) => s.setIntegration);
  const toast = useToast();
  const [busy, setBusy] = useState<GoogleIntegrationPlugin | null>(null);

  const connected: Record<GoogleIntegrationPlugin, boolean> = {
    gmail: gmailConnected,
    googlecalendar: calendarConnected,
  };

  async function handleDisconnect(plugin: GoogleIntegrationPlugin) {
    setBusy(plugin);
    try {
      await disconnectIntegration(plugin);
      setIntegration(plugin, "not_connected");
      toast.success(`Disconnected ${INTEGRATION_META[plugin].short}`);
    } catch {
      toast.error("Couldn't disconnect. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {PLUGINS.map((plugin) => {
        const meta = INTEGRATION_META[plugin];
        const Icon = meta.icon;
        const isConnected = connected[plugin];

        return (
          <SpotlightCard key={plugin} className="flex items-center gap-4 p-4">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
              style={tintStyle(meta.color)}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-ink text-sm font-semibold">{meta.short}</p>
              <p className="mt-0.5 text-xs">
                {isConnected ? (
                  <span className="text-success inline-flex items-center gap-1 font-medium">
                    <Check className="h-3 w-3" /> Connected
                  </span>
                ) : (
                  <span className="text-ink-3">{meta.description}</span>
                )}
              </p>
            </div>
            {isConnected ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDisconnect(plugin)}
                disabled={busy === plugin}
                className="text-danger hover:bg-danger/10 hover:border-danger/40 min-w-[7.5rem] shrink-0 justify-center"
              >
                {busy === plugin ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : (
                  <>
                    <Unplug className="h-3.5 w-3.5" />
                    Disconnect
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => connect(plugin)}
                disabled={connecting[plugin]}
                className="min-w-[6.5rem] shrink-0 justify-center"
              >
                {connecting[plugin] ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : (
                  <>
                    <Plug className="h-3.5 w-3.5" />
                    Connect
                  </>
                )}
              </Button>
            )}
          </SpotlightCard>
        );
      })}
    </div>
  );
}

/* -------------------------------- Usage -------------------------------- */

function Meter({
  icon: Icon,
  label,
  used,
  limit,
  color,
}: {
  icon: LucideIcon;
  label: string;
  used: number;
  limit: number;
  color: string;
}) {
  const unlimited = limit < 0;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const atLimit = !unlimited && used >= limit;

  const [width, setWidth] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <SpotlightCard className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-ink inline-flex items-center gap-2.5 text-sm font-medium">
          <span
            className="grid h-7 w-7 place-items-center rounded-lg"
            style={{ backgroundColor: `${color}1a`, color }}
          >
            <Icon className="h-4 w-4" />
          </span>
          {label}
        </span>
        <span className="text-ink text-base font-semibold tabular-nums">
          {used}
          {unlimited ? (
            <span className="text-ink-3 text-sm font-normal"> · Unlimited</span>
          ) : (
            <span className="text-ink-3 text-sm font-normal"> / {limit}</span>
          )}
        </span>
      </div>
      {!unlimited && (
        <div className="bg-surface mt-3 h-2 w-full overflow-hidden rounded-full">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ width: `${width}%`, backgroundColor: atLimit ? "var(--color-danger)" : color }}
          />
        </div>
      )}
    </SpotlightCard>
  );
}

function UsageSection() {
  const data = useSubscriptionStore((s) => s.data);
  const loaded = useSubscriptionStore((s) => s.loaded);

  if (!loaded || !data) {
    return (
      <div className="grid place-items-center py-12">
        <Spinner className="text-accent h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Meter
        icon={MessageSquare}
        label="Chats"
        used={data.usage.chats}
        limit={data.limits.chats}
        color="var(--color-accent)"
      />
      <Meter
        icon={MessagesSquare}
        label="In-depth conversations"
        used={data.usage.conversations}
        limit={data.limits.conversations}
        color="#8b7cff"
      />
      <Meter
        icon={RefreshCw}
        label="Email syncs"
        used={data.usage.emailSyncs}
        limit={data.limits.emailSyncs}
        color="#14b8a6"
      />
    </div>
  );
}

/* ----------------------------- Danger Zone ----------------------------- */

function DangerSection() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <SpotlightCard className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-ink text-sm font-semibold">Delete account</p>
          <p className="text-ink-2 mt-0.5 text-xs leading-relaxed">
            Permanently remove your account and all associated data. This cannot be undone.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setModalOpen(true)}
          className="bg-danger hover:bg-danger/85 shrink-0 border-transparent text-white"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Delete account
        </Button>
      </SpotlightCard>

      {modalOpen && <DeleteAccountModal onClose={() => setModalOpen(false)} />}
    </>
  );
}

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const { signOut } = useClerk();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteAccount();
      await signOut({ redirectUrl: "/" });
    } catch {
      toast.error("Failed to delete account. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          if (!busy) onClose();
        }}
      />

      {/* Panel */}
      <div className="bg-panel border-line animate-scale-in relative w-full max-w-md rounded-2xl border shadow-2xl">
        {/* Warning icon header */}
        <div className="flex flex-col items-center gap-3 px-6 pb-5 pt-7 text-center">
          <span className="bg-danger/10 text-danger grid h-12 w-12 place-items-center rounded-full">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h2 id="delete-modal-title" className="text-ink text-base font-semibold">
              Delete your account?
            </h2>
            <p className="text-ink-2 mt-1.5 text-sm leading-relaxed">
              This will permanently delete your account, all emails, chats, calendar data, and
              payment history. You will be signed out immediately.{" "}
              <strong className="text-ink font-semibold">This action cannot be undone.</strong>
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-line border-t" />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={busy}
            onClick={handleDelete}
            className="bg-danger hover:bg-danger/90 border-transparent text-white"
          >
            {busy ? <Spinner className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            {busy ? "Deleting…" : "Yes, delete my account"}
          </Button>
        </div>
      </div>
    </div>
  );
}
