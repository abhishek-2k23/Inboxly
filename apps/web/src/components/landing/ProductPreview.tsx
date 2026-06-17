"use client";

import {
  Archive,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Inbox,
  Lock,
  Mail,
  MessageSquare,
  PenLine,
  Plus,
  RotateCw,
  Search,
  Send,
  Settings,
  Share2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { buildMonthGrid, isSameMonth, WEEKDAYS } from "@/lib/calendar-utils";
import { avatarColor, cn, initials, PRIORITY_COLOR, type Priority } from "@/lib/ui";

/*
 * The hero centerpiece: a big, interactive replica of the real /dashboard.
 * It reuses the live app's theme tokens (bg-bg-secondary, surface, ink, line,
 * PRIORITY_COLOR, ...) and layout idioms (Sidebar / InboxHeader / EmailRow /
 * MonthView), so it stays pixel-faithful and flips with the light/dark theme
 * for free. All data is mock — no API. Not scrollable; sized to feel spacious.
 */

type View = "agent" | "inbox" | "sent" | "drafts" | "archive" | "calendar" | "settings";

const NAV: { view: View; label: string; icon: LucideIcon }[] = [
  { view: "agent", label: "AI Agent", icon: Sparkles },
  { view: "inbox", label: "Inbox", icon: Inbox },
  { view: "sent", label: "Sent", icon: Send },
  { view: "drafts", label: "Drafts", icon: FileText },
  { view: "archive", label: "Archive", icon: Archive },
  { view: "calendar", label: "Calendar", icon: CalendarDays },
  { view: "settings", label: "Settings", icon: Settings },
];

export function ProductPreview() {
  const [view, setView] = useState<View>("agent");
  const [query, setQuery] = useState("");

  const isMail = view === "inbox" || view === "sent" || view === "drafts" || view === "archive";

  return (
    <div className="card-premium mx-auto max-w-6xl overflow-hidden rounded-2xl shadow-[0_40px_90px_-40px_rgba(0,0,0,0.5)]">
      {/* macOS browser chrome — tab strip + toolbar */}
      <div className="bg-surface/60 border-line flex items-end gap-3 border-b px-4 pt-2.5">
        {/* traffic lights */}
        <div className="flex items-center gap-2 pb-2.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        {/* active tab */}
        <div className="bg-bg border-line text-ink-2 flex w-44 items-center gap-2 rounded-t-lg border border-b-0 px-3 py-1.5 text-xs">
          <span className="bg-accent text-accent-ink grid h-4 w-4 shrink-0 place-items-center rounded-[4px] text-[8px] font-bold">
            I
          </span>
          <span className="flex-1 truncate">Inboxly</span>
        </div>
        <Plus className="text-ink-3 mb-2 hidden h-3.5 w-3.5 sm:block" />
      </div>

      {/* toolbar */}
      <div className="border-line bg-surface/30 flex items-center gap-3 border-b px-4 py-2">
        <div className="text-ink-3 flex items-center gap-1.5">
          <ChevronLeft className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
          <RotateCw className="h-3.5 w-3.5" />
        </div>
        <div className="bg-bg text-ink-2 mx-auto flex h-7 w-full max-w-md items-center justify-center gap-1.5 rounded-full px-3 text-xs">
          <Lock className="text-ink-3 h-3 w-3" />
          inboxly.iamabhishek01.dev
        </div>
        <div className="text-ink-3 hidden items-center gap-2.5 sm:flex">
          <Share2 className="h-3.5 w-3.5" />
          <Plus className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="border-line bg-bg-secondary flex w-14 shrink-0 flex-col border-r sm:w-48">
          <nav className="flex flex-1 flex-col gap-0.5 p-2">
            {NAV.map((item) => {
              const active = item.view === view;
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => {
                    setView(item.view);
                    setQuery("");
                  }}
                  title={item.label}
                  className={cn(
                    "flex items-center justify-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors sm:justify-start",
                    active
                      ? "bg-surface text-ink font-medium"
                      : "text-ink-2 hover:bg-surface hover:text-ink",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="hidden flex-1 text-left sm:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-line flex items-center gap-2 border-t p-3">
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.6rem] font-semibold text-white"
              style={{ backgroundColor: avatarColor("Alex Rivera") }}
            >
              {initials("Alex Rivera")}
            </span>
            <div className="hidden min-w-0 flex-1 sm:block">
              <p className="text-ink truncate text-xs font-medium">Alex Rivera</p>
              <p className="text-ink-3 truncate text-[10px]">alex@inboxly.app</p>
            </div>
          </div>
        </aside>

        {/* Main panel — fixed height so the window stays intact across views. */}
        <div className="flex h-[680px] min-w-0 flex-1 flex-col overflow-hidden">
          {isMail && (
            <header className="border-line shrink-0 border-b">
              <div className="flex h-12 items-center gap-2 px-4">
                <div className="relative mx-auto w-full max-w-xs">
                  <Search className="text-ink-3 pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search mail"
                    className="border-line bg-surface text-ink placeholder:text-ink-3 focus:border-line-strong focus:bg-panel h-8 w-full rounded-full border pl-8 pr-3 text-[13px] outline-none transition-colors"
                  />
                </div>
                <button
                  type="button"
                  className="bg-accent text-accent-ink hover:bg-accent-light inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  <span className="hidden sm:inline">Compose</span>
                </button>
              </div>
            </header>
          )}

          {isMail && <MailFolder view={view} query={query} />}
          {view === "agent" && <AgentPanel />}
          {view === "calendar" && <CalendarPanel />}
          {view === "settings" && <SettingsPanel />}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Mail ─────────────────────────── */

interface DemoMail {
  name: string;
  subject: string;
  snippet: string;
  time: string;
  priority?: Priority;
  unread?: boolean;
  draft?: boolean;
}

const MAIL: Record<"inbox" | "sent" | "drafts" | "archive", DemoMail[]> = {
  inbox: [
    {
      name: "Sarah Chen",
      subject: "Q3 roadmap review",
      snippet: "Sharing the updated deck ahead of Thursday's sync — let me know your thoughts.",
      time: "9:24 AM",
      priority: "urgent",
      unread: true,
    },
    {
      name: "GitHub",
      subject: "[inboxly] 3 new pull requests",
      snippet: "@dependabot opened 3 PRs in your repository this morning.",
      time: "8:01 AM",
      priority: "low",
      unread: true,
    },
    {
      name: "Marcus Lee",
      subject: "Re: Lunch Thursday?",
      snippet: "Works for me — see you at 12:30 at the usual place.",
      time: "Tue",
      priority: "medium",
    },
    {
      name: "Figma",
      subject: "Aanya commented on your file",
      snippet: "“Can we tighten the spacing on the hero here?”",
      time: "Mon",
      priority: "low",
    },
    {
      name: "Notion",
      subject: "Your weekly digest",
      snippet: "5 pages updated across 2 teamspaces.",
      time: "Mon",
    },
    {
      name: "Priya Nair",
      subject: "Contract renewal terms",
      snippet: "Attaching the redlined agreement for your review.",
      time: "Sun",
      priority: "medium",
    },
    {
      name: "Slack",
      subject: "Aanya mentioned you in #design",
      snippet: "“@alex can you take a look at the new flow?”",
      time: "Sun",
      priority: "low",
    },
    {
      name: "Calendly",
      subject: "New event: Intro call",
      snippet: "Jordan booked Thursday at 3:00 PM.",
      time: "Sat",
      priority: "medium",
    },
  ],
  sent: [
    {
      name: "Sarah Chen",
      subject: "Re: Q3 roadmap review",
      snippet: "Thanks Sarah — comments inline, mostly small wording tweaks.",
      time: "9:31 AM",
    },
    {
      name: "design-team",
      subject: "Spec: onboarding revamp",
      snippet: "Here's the v2 spec for review before we build.",
      time: "Tue",
    },
    {
      name: "Marcus Lee",
      subject: "Lunch Thursday?",
      snippet: "Want to grab lunch this week? Thursday looks open.",
      time: "Mon",
    },
    {
      name: "Jordan Blake",
      subject: "Intro call follow-up",
      snippet: "Great chatting — here's the one-pager I mentioned.",
      time: "Mon",
    },
    {
      name: "finance@inboxly",
      subject: "Q2 expense report",
      snippet: "Submitting receipts for last quarter, all attached.",
      time: "Sun",
    },
  ],
  drafts: [
    {
      name: "Priya Nair",
      subject: "Re: Contract renewal",
      snippet: "Hi Priya, following up on the renewal terms we discussed —",
      time: "now",
      draft: true,
    },
    {
      name: "",
      subject: "(no subject)",
      snippet: "Quick note about the launch timeline before Friday...",
      time: "Tue",
      draft: true,
    },
  ],
  archive: [
    {
      name: "Stripe",
      subject: "Your receipt from Inboxly",
      snippet: "Payment of $20.00 succeeded. View your invoice.",
      time: "Jun 2",
    },
    {
      name: "LinkedIn",
      subject: "You appeared in 12 searches",
      snippet: "See who's been viewing your profile this week.",
      time: "May 28",
    },
    {
      name: "Amazon",
      subject: "Your order has shipped",
      snippet: "Arriving Friday, May 30 — track your package.",
      time: "May 26",
    },
    {
      name: "Google",
      subject: "Security alert",
      snippet: "New sign-in to your account on macOS.",
      time: "May 24",
    },
    {
      name: "Vercel",
      subject: "Deployment ready",
      snippet: "inboxly.iamabhishek01.dev is live in production.",
      time: "May 21",
    },
  ],
};

function MailFolder({
  view,
  query,
}: {
  view: "inbox" | "sent" | "drafts" | "archive";
  query: string;
}) {
  const rows = useMemo(() => {
    const list = MAIL[view];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((m) => `${m.name} ${m.subject} ${m.snippet}`.toLowerCase().includes(q));
  }, [view, query]);

  if (rows.length === 0) {
    return (
      <div className="bg-bg flex flex-1 flex-col items-center justify-center px-6 text-center">
        <Mail className="text-ink-3 h-8 w-8" />
        <p className="text-ink mt-3 text-sm font-medium">No matching mail</p>
        <p className="text-ink-3 mt-1 text-xs">Try a different name, subject, or keyword.</p>
      </div>
    );
  }

  return (
    <ul className="bg-bg divide-line/60 flex-1 divide-y">
      {rows.map((mail, i) => {
        const name = mail.draft ? mail.name || "No recipient" : mail.name;
        return (
          <li key={`${mail.subject}-${i}`}>
            <button
              type="button"
              className="hover:bg-surface-hover flex w-full items-start gap-3 px-4 py-3 text-left transition-colors"
            >
              <span
                aria-hidden
                className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-[0.7rem] font-semibold text-white"
                style={{ backgroundColor: avatarColor(name) }}
              >
                {initials(name)}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "min-w-0 truncate text-sm",
                      mail.unread ? "text-ink font-semibold" : "text-ink font-medium",
                    )}
                  >
                    {name}
                  </span>
                  {mail.priority && mail.priority !== "none" && (
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: PRIORITY_COLOR[mail.priority] }}
                    />
                  )}
                </span>

                <span
                  className={cn(
                    "mt-0.5 block truncate text-sm",
                    mail.unread ? "text-ink font-medium" : "text-ink-2",
                  )}
                >
                  {mail.subject}
                </span>

                <span className="text-ink-3 mt-0.5 block truncate text-xs leading-relaxed">
                  {mail.draft && <span className="text-danger font-medium">Draft</span>}
                  {mail.draft && mail.snippet && " – "}
                  {mail.snippet}
                </span>
              </span>

              <span className="text-ink-3 mt-0.5 shrink-0 whitespace-nowrap text-xs tabular-nums">
                {mail.time}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ─────────────────────────── AI Agent ─────────────────────────── */

interface AgentMessage {
  role: "user" | "assistant";
  text: string;
}

const ACTION_CARDS: { icon: LucideIcon; title: string; desc: string; prompt: string }[] = [
  {
    icon: Mail,
    title: "Summarize my inbox",
    desc: "A quick digest of what needs attention.",
    prompt: "Summarize my unread emails",
  },
  {
    icon: PenLine,
    title: "Draft a reply",
    desc: "Reply to Sarah about the Q3 roadmap.",
    prompt: "Draft a reply to Sarah about the Q3 roadmap",
  },
  {
    icon: CalendarPlus,
    title: "Schedule a meeting",
    desc: "Find a slot and send the invite.",
    prompt: "Schedule a 30-min sync with Marcus tomorrow",
  },
  {
    icon: Search,
    title: "Find an email",
    desc: "Search across your whole mailbox.",
    prompt: "Find the invoice from Stripe last month",
  },
];

function cannedReply(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes("calendar") || p.includes("schedule") || p.includes("meeting")) {
    return "You're free 2:00–2:30pm tomorrow — I've drafted an invite to Marcus titled “Quick sync.” Want me to send it?";
  }
  if (p.includes("summar") || p.includes("inbox") || p.includes("unread")) {
    return "You have 3 urgent emails: Sarah's Q3 roadmap review, Priya's contract terms, and a GitHub PR digest. Want a one-line summary of each?";
  }
  if (p.includes("draft") || p.includes("reply")) {
    return "Here's a draft: “Hi Sarah — thanks for the updated deck. The roadmap looks solid; my only note is on timeline slack in Q3. Happy to discuss Thursday.” Send it?";
  }
  if (p.includes("find") || p.includes("invoice") || p.includes("search")) {
    return "Found it — “Your receipt from Inboxly” from Stripe, dated Jun 2, $20.00. Want me to open it?";
  }
  return "On it — I'll pull the relevant emails and calendar events and put together a response for you.";
}

function AgentPanel() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");

  function send(text: string) {
    const value = text.trim();
    if (!value) return;
    setMessages((prev) => [...prev, { role: "user", text: value }]);
    setInput("");
    // Simulated assistant response so the demo feels alive.
    window.setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", text: cannedReply(value) }]);
    }, 550);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    send(input);
  }

  const empty = messages.length === 0;

  return (
    <div className="bg-bg flex min-h-0 flex-1 flex-col p-5">
      {empty ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="bg-primary-soft text-accent grid h-12 w-12 place-items-center rounded-2xl">
            <Sparkles className="h-6 w-6" />
          </span>
          <h4 className="text-ink mt-4 text-lg font-semibold tracking-tight">Good morning, Alex</h4>
          <p className="text-ink-2 mt-1 text-sm">Pick a task or ask anything about your day.</p>

          <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
            {ACTION_CARDS.map((card) => (
              <button
                key={card.title}
                type="button"
                onClick={() => send(card.prompt)}
                className="border-line bg-panel hover:border-line-strong hover:bg-surface group flex items-start gap-3 rounded-xl border p-3 text-left transition-colors"
              >
                <span className="bg-primary-soft text-accent grid h-8 w-8 shrink-0 place-items-center rounded-lg">
                  <card.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="text-ink block text-sm font-medium">{card.title}</span>
                  <span className="text-ink-3 mt-0.5 block text-xs leading-relaxed">
                    {card.desc}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-end gap-4">
          {messages.map((message, i) =>
            message.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="bg-accent text-accent-ink max-w-[80%] rounded-2xl rounded-tr-md px-4 py-2.5 text-sm leading-relaxed">
                  {message.text}
                </div>
              </div>
            ) : (
              <div key={i} className="flex items-start gap-3">
                <span className="bg-primary-soft text-accent grid h-8 w-8 shrink-0 place-items-center rounded-full">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="text-ink min-w-0 flex-1 text-sm leading-relaxed">
                  {message.text}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {/* Input — type a value and hit enter / send. */}
      <form
        onSubmit={onSubmit}
        className="border-line bg-panel mt-5 flex items-center gap-2 rounded-full border px-4 py-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message Inboxly…"
          className="text-ink placeholder:text-ink-3 min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        <button
          type="submit"
          aria-label="Send"
          className="bg-accent text-accent-ink hover:bg-accent-light grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

/* ─────────────────────────── Calendar (Month view) ─────────────────────────── */

interface MonthEvent {
  title: string;
  time: string;
  tone: Priority;
  meta?: string;
}

/** Mock events keyed by day-of-month so they land in whatever month is shown. */
const MONTH_EVENTS: Record<number, MonthEvent[]> = {
  4: [{ title: "Team standup", time: "9:00 AM", tone: "low" }],
  9: [{ title: "Design review", time: "11:30 AM", tone: "medium", meta: "Google Meet" }],
  12: [
    { title: "1:1 with Marcus", time: "2:00 PM", tone: "urgent" },
    { title: "Roadmap sync", time: "4:30 PM", tone: "low", meta: "Google Meet" },
    { title: "Investor call", time: "5:30 PM", tone: "medium" },
    { title: "Dinner with team", time: "7:30 PM", tone: "low" },
  ],
  18: [{ title: "Product launch", time: "10:00 AM", tone: "urgent", meta: "All hands" }],
  23: [{ title: "Sprint planning", time: "1:00 PM", tone: "medium" }],
  27: [{ title: "Retro", time: "3:00 PM", tone: "low" }],
};

const MAX_VISIBLE = 2;

function CalendarPanel() {
  const anchor = new Date();
  const days = buildMonthGrid(anchor);
  const todayStr = anchor.toDateString();
  const monthLabel = anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="bg-bg flex flex-1 flex-col">
      {/* Header */}
      <div className="border-line flex h-12 shrink-0 items-center justify-between border-b px-4">
        <h4 className="text-ink text-sm font-semibold">{monthLabel}</h4>
        <div className="flex items-center gap-1">
          <span className="text-ink-2 hover:bg-surface hover:text-ink grid h-7 w-7 place-items-center rounded-lg transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </span>
          <span className="border-line text-ink-2 hover:bg-surface hover:text-ink rounded-lg border px-2.5 py-1 text-xs transition-colors">
            Today
          </span>
          <span className="text-ink-2 hover:bg-surface hover:text-ink grid h-7 w-7 place-items-center rounded-lg transition-colors">
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>

      {/* Weekday row */}
      <div className="border-line grid grid-cols-7 border-b">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="text-ink-3 px-2 py-2 text-center text-[0.65rem] font-semibold uppercase tracking-widest"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {days.map((day, i) => {
          const key = day.toDateString();
          const inMonth = isSameMonth(day, anchor);
          const isToday = key === todayStr;
          const events = inMonth ? (MONTH_EVENTS[day.getDate()] ?? []) : [];
          const visible = events.slice(0, MAX_VISIBLE);
          const overflow = events.length - visible.length;
          const colIndex = i % 7;
          const lastCol = colIndex === 6;
          const flipUp = Math.floor(i / 7) >= 4;
          const alignRight = colIndex >= 5;

          return (
            <div
              key={key}
              className={cn(
                "border-line-subtle group/cell relative flex flex-col gap-0.5 border-b p-1.5 transition-colors",
                !lastCol && "border-r",
                inMonth ? "hover:bg-surface-hover/50" : "bg-surface/30",
                isToday && "bg-accent/[0.06]",
              )}
            >
              <span
                className={cn(
                  "mb-0.5 grid h-6 w-6 place-items-center rounded-full text-xs font-semibold transition-colors",
                  isToday
                    ? "bg-accent text-accent-ink shadow-sm"
                    : inMonth
                      ? "text-ink-2 group-hover/cell:text-ink"
                      : "text-ink-3",
                )}
              >
                {day.getDate()}
              </span>

              <div className="flex min-h-0 flex-1 flex-col gap-0.5">
                {visible.map((event) => (
                  <EventChip
                    key={event.title}
                    event={event}
                    flipUp={flipUp}
                    alignRight={alignRight}
                  />
                ))}
                {overflow > 0 && (
                  <span className="text-ink-3 px-1.5 text-[0.7rem] font-semibold">
                    +{overflow} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventChip({
  event,
  flipUp,
  alignRight,
}: {
  event: MonthEvent;
  flipUp: boolean;
  alignRight: boolean;
}) {
  const color = PRIORITY_COLOR[event.tone];

  return (
    <div className="group/ev relative">
      <button
        type="button"
        className="hover:bg-surface-hover flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition-colors"
      >
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 0 3px ${color}1f` }}
        />
        <span className="text-ink-3 hidden shrink-0 text-[0.68rem] sm:inline">
          {event.time.replace(":00", "")}
        </span>
        <span className="text-ink truncate text-xs font-medium">{event.title}</span>
      </button>

      {/* Hover popover — quick event info. */}
      <div
        className={cn(
          "border-line bg-panel ring-line/50 pointer-events-none absolute z-30 hidden w-44 rounded-xl border p-3 opacity-0 shadow-xl ring-1 transition-opacity group-hover/ev:block group-hover/ev:opacity-100",
          flipUp ? "bottom-full mb-1" : "top-full mt-1",
          alignRight ? "right-0" : "left-0",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-ink truncate text-sm font-semibold">{event.title}</span>
        </div>
        <p className="text-ink-2 mt-1.5 text-xs">{event.time}</p>
        {event.meta && <p className="text-ink-3 mt-0.5 text-xs">{event.meta}</p>}
      </div>
    </div>
  );
}

/* ─────────────────────────── Settings ─────────────────────────── */

const INTEGRATIONS: { icon: LucideIcon; name: string; color: string }[] = [
  { icon: Mail, name: "Gmail", color: "var(--color-prio-urgent)" },
  { icon: CalendarDays, name: "Google Calendar", color: "var(--color-accent)" },
];

const METERS: { icon: LucideIcon; label: string; used: number; limit: number; color: string }[] = [
  { icon: MessageSquare, label: "Chats", used: 320, limit: 1000, color: "var(--color-accent)" },
  { icon: Inbox, label: "Email syncs", used: 18, limit: 50, color: "var(--color-prio-medium)" },
];

function SettingsPanel() {
  return (
    <div className="bg-bg flex flex-1 flex-col">
      <div className="border-line flex h-12 shrink-0 items-center border-b px-4">
        <h4 className="text-ink text-sm font-semibold">Settings</h4>
      </div>

      <div className="flex flex-col gap-6 p-5">
        {/* Integrations */}
        <section>
          <h5 className="text-ink text-sm font-semibold">Integrations</h5>
          <p className="text-ink-2 mt-0.5 text-xs">
            Manage the Google services Inboxly can access.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {INTEGRATIONS.map((it) => (
              <SpotlightCard key={it.name} className="flex items-center gap-3 p-4">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                  style={{ backgroundColor: `${it.color}1a`, color: it.color }}
                >
                  <it.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink text-sm font-semibold">{it.name}</p>
                  <p className="text-success mt-0.5 inline-flex items-center gap-1 text-xs font-medium">
                    <Check className="h-3 w-3" /> Connected
                  </p>
                </div>
                <Button size="sm" variant="outline" className="text-ink-2 shrink-0">
                  Manage
                </Button>
              </SpotlightCard>
            ))}
          </div>
        </section>

        {/* Usage */}
        <section>
          <h5 className="text-ink text-sm font-semibold">Usage</h5>
          <p className="text-ink-2 mt-0.5 text-xs">
            Your activity against this month&apos;s allowance.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {METERS.map((m) => {
              const pct = Math.min(100, Math.round((m.used / m.limit) * 100));
              return (
                <SpotlightCard key={m.label} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-ink inline-flex items-center gap-2.5 text-sm font-medium">
                      <span
                        className="grid h-7 w-7 place-items-center rounded-lg"
                        style={{ backgroundColor: `${m.color}1a`, color: m.color }}
                      >
                        <m.icon className="h-4 w-4" />
                      </span>
                      {m.label}
                    </span>
                    <span className="text-ink text-sm font-semibold tabular-nums">
                      {m.used}
                      <span className="text-ink-3 font-normal"> / {m.limit}</span>
                    </span>
                  </div>
                  <div className="bg-surface mt-3 h-2 w-full overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: m.color }}
                    />
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
