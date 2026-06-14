"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import type { GoogleIntegrationPlugin, IntegrationStatusResponse } from "@repo/shared";
import { connectUrl, getIntegrationStatus } from "@/lib/api";
import { cn } from "@/lib/ui";
import { Avatar } from "@/components/ui";

const TABS = [
  { id: "account", label: "Account", icon: "ti-user" },
  { id: "apps", label: "Connected Apps", icon: "ti-plug" },
  { id: "ai", label: "AI Preferences", icon: "ti-sparkles" },
  { id: "keys", label: "Keyboard Shortcuts", icon: "ti-keyboard" },
  { id: "billing", label: "Billing", icon: "ti-credit-card" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>("account");

  return (
    <div className="flex h-full flex-col">
      <header className="hairline-b flex shrink-0 items-center gap-2 px-6 py-5">
        <i className="ti ti-settings text-accent-light" aria-hidden />
        <h1 className="text-ink text-base font-medium">Settings</h1>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav className="hairline-r flex w-56 shrink-0 flex-col gap-0.5 p-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-[var(--radius-ctl)] px-3 py-2 text-left text-sm transition-colors",
                tab === t.id
                  ? "bg-accent-fill text-accent-light"
                  : "text-ink-2 hover:bg-surface hover:text-ink",
              )}
            >
              <i className={cn("ti", t.icon)} aria-hidden />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          <div className="mx-auto max-w-2xl">
            {tab === "account" && <AccountTab />}
            {tab === "apps" && <AppsTab />}
            {tab === "ai" && <AiTab />}
            {tab === "keys" && <KeysTab />}
            {tab === "billing" && <BillingTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-panel hairline mb-6 flex flex-col gap-3 rounded-[var(--radius-card)] p-5">
      <div>
        <h2 className="text-ink text-sm font-medium">{title}</h2>
        {hint && <p className="text-ink-3 mt-0.5 text-xs">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function AccountTab() {
  const { user } = useUser();
  const name = user?.fullName || user?.firstName || "Inboxly user";
  const email = user?.primaryEmailAddress?.emailAddress ?? "—";
  return (
    <Section title="Profile" hint="Managed through your Inboxly account.">
      <div className="flex items-center gap-3">
        <Avatar name={name} size={48} />
        <div>
          <p className="text-ink text-sm">{name}</p>
          <p className="text-ink-2 text-xs">{email}</p>
        </div>
      </div>
    </Section>
  );
}

const PLUGINS: Array<{ id: GoogleIntegrationPlugin; name: string; icon: string; desc: string }> = [
  { id: "gmail", name: "Gmail", icon: "ti-mail", desc: "Read, search, and send email." },
  {
    id: "googlecalendar",
    name: "Google Calendar",
    icon: "ti-calendar",
    desc: "Read events and send invites.",
  },
];

function AppsTab() {
  const [status, setStatus] = useState<IntegrationStatusResponse | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus(await getIntegrationStatus());
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Section
      title="Connected apps"
      hint="Connect Google via Corsair to power your inbox and calendar."
    >
      {error && <p className="text-prio-urgent text-xs">Couldn’t load connection status.</p>}
      <ul className="flex flex-col gap-2">
        {PLUGINS.map((p) => {
          const state = status?.[p.id];
          const connected = state === "connected";
          return (
            <li
              key={p.id}
              className="bg-surface hairline flex items-center gap-3 rounded-[var(--radius-ctl)] p-3"
            >
              <span className="bg-page text-ink-2 flex h-9 w-9 items-center justify-center rounded-[var(--radius-ctl)]">
                <i className={cn("ti", p.icon)} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-ink text-sm">{p.name}</p>
                <p className="text-ink-3 truncate text-xs">{p.desc}</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: connected ? "var(--color-accent)" : "var(--color-prio-none)",
                  }}
                />
                <span className={connected ? "text-accent-light" : "text-ink-3"}>
                  {connected ? "Connected" : "Not connected"}
                </span>
              </span>
              <a
                href={connectUrl(p.id)}
                className="text-ink-2 hairline hover:text-ink rounded-[var(--radius-ctl)] px-3 py-1.5 text-xs transition-colors"
              >
                {connected ? "Reconnect" : "Connect"}
              </a>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
        checked ? "bg-accent" : "bg-surface hairline",
      )}
    >
      <span
        className={cn(
          "bg-ink absolute top-0.5 h-4 w-4 rounded-full transition-transform",
          checked ? "bg-accent-ink left-0.5 translate-x-4" : "left-0.5",
        )}
      />
    </button>
  );
}

function AiTab() {
  const [vips, setVips] = useState("");
  const [keywords, setKeywords] = useState("urgent, asap, deadline");
  const [autoCategorize, setAutoCategorize] = useState(true);
  const [sensitivity, setSensitivity] = useState(60);
  const [saved, setSaved] = useState(false);

  const FIELD =
    "w-full rounded-[var(--radius-ctl)] bg-page px-3 py-2 text-sm text-ink outline-none hairline placeholder:text-ink-3 focus:border-accent";

  return (
    <>
      <Section title="Priority rules" hint="Feeds the LLM priority classifier.">
        <label className="text-ink-2 text-xs">VIP senders (comma-separated)</label>
        <input
          value={vips}
          onChange={(e) => setVips(e.target.value)}
          placeholder="boss@company.com, important@client.com"
          className={FIELD}
        />
        <label className="text-ink-2 mt-2 text-xs">Urgent keywords</label>
        <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className={FIELD} />
      </Section>

      <Section title="Filtering">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-ink text-sm">Auto-categorize inbox</p>
            <p className="text-ink-3 text-xs">Sort mail into Primary, Updates, Promotions.</p>
          </div>
          <Toggle checked={autoCategorize} onChange={setAutoCategorize} />
        </div>
        <div className="mt-3">
          <div className="text-ink-2 mb-1 flex items-center justify-between text-xs">
            <span>Filtering sensitivity</span>
            <span className="text-accent-light">{sensitivity}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
          />
        </div>
      </Section>

      <button
        type="button"
        onClick={() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 1800);
        }}
        className="bg-accent text-accent-ink hover:bg-accent-light flex items-center gap-2 rounded-[var(--radius-ctl)] px-4 py-2 text-sm font-medium transition-colors"
      >
        <i className={cn("ti", saved ? "ti-check" : "ti-device-floppy")} aria-hidden />
        {saved ? "Saved" : "Save preferences"}
      </button>
    </>
  );
}

const SHORTCUTS = [
  { keys: "⌘/Ctrl K", action: "Open prompt bar" },
  { keys: "C", action: "Compose / focus prompt" },
  { keys: "/", action: "Focus search" },
  { keys: "J / K", action: "Next / previous email" },
  { keys: "R", action: "Reply" },
  { keys: "E", action: "Archive" },
  { keys: "G then I", action: "Go to inbox" },
  { keys: "G then C", action: "Go to calendar" },
  { keys: "G then S", action: "Go to settings" },
  { keys: "?", action: "Show all shortcuts" },
];

function KeysTab() {
  return (
    <Section title="Keyboard shortcuts" hint="Inboxly is keyboard-first.">
      <ul className="flex flex-col gap-2">
        {SHORTCUTS.map((s) => (
          <li key={s.keys} className="flex items-center justify-between text-sm">
            <span className="text-ink-2">{s.action}</span>
            <kbd className="bg-surface text-ink hairline rounded-[var(--radius-ctl)] px-2 py-0.5 text-xs">
              {s.keys}
            </kbd>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function BillingTab() {
  const used = 312;
  const limit = 1000;
  const pct = Math.round((used / limit) * 100);
  return (
    <>
      <Section title="Plan" hint="You’re on the Pro plan.">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-accent-fill text-accent-light rounded-full px-2.5 py-0.5 text-xs font-medium">
              Pro
            </span>
            <span className="text-ink-2 text-sm">$12 / month</span>
          </div>
          <button
            type="button"
            className="text-ink-2 hairline hover:text-ink rounded-[var(--radius-ctl)] px-3 py-1.5 text-xs transition-colors"
          >
            Manage subscription
          </button>
        </div>
      </Section>

      <Section title="Prompts this period" hint="Resets on the 1st of each month.">
        <div className="text-ink-2 flex items-center justify-between text-xs">
          <span>
            {used} / {limit} prompts
          </span>
          <span className="text-accent-light">{100 - pct}% left</span>
        </div>
        <div className="bg-surface h-2 w-full overflow-hidden rounded-full">
          <div className="bg-accent h-full rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </Section>
    </>
  );
}
