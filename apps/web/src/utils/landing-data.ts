import {
  CalendarClock,
  Inbox,
  LayoutDashboard,
  Search,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface Step {
  number: string;
  title: string;
  body: string;
}

export const STEPS: Step[] = [
  {
    number: "1",
    title: "Connect Gmail & Calendar",
    body: "Securely link your Google account. Inboxly reads only what it needs to help you move faster.",
  },
  {
    number: "2",
    title: "Ask Inboxly what you need",
    body: "Type a request in plain English — summarize, draft, schedule, or search. No menus to learn.",
  },
  {
    number: "3",
    title: "Review & approve actions",
    body: "Inboxly drafts the reply or event. You stay in control — review, tweak, and send with one click.",
  },
];

export interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
}

export const FEATURES: Feature[] = [
  {
    icon: Sparkles,
    title: "AI Email Assistant",
    body: "Turn a one-line instruction into a polished, ready-to-send reply that sounds like you.",
  },
  {
    icon: Inbox,
    title: "Inbox Summaries",
    body: "Get a clear digest of what's urgent, what needs a reply, and what can wait — in seconds.",
  },
  {
    icon: CalendarClock,
    title: "Smart Scheduling",
    body: "Create events from a sentence. Inboxly resolves the time, invites guests, and adds a Meet link.",
  },
  {
    icon: Users,
    title: "Meeting Coordination",
    body: "Find a slot, send invitations, and keep everyone in the loop without the back-and-forth.",
  },
  {
    icon: Search,
    title: "Email Search",
    body: "Ask for an email by topic or sender. Semantic search finds it even when you forget the keywords.",
  },
  {
    icon: LayoutDashboard,
    title: "Unified Workspace",
    body: "Email and calendar in one calm surface, so you stop switching tabs to get through your day.",
  },
];

export interface UseCase {
  prompt: string;
  result: string;
}

export const USE_CASES: UseCase[] = [
  {
    prompt: "Schedule a meeting with Rahul next Tuesday at 3pm.",
    result: "Meeting created and invitations sent.",
  },
  {
    prompt: "Summarize my unread emails.",
    result: "AI-generated inbox summary, grouped by priority.",
  },
  {
    prompt: "Draft a follow-up email to the design team.",
    result: "A ready-to-send draft, in your tone.",
  },
];

export interface Review {
  name: string;
  role: string;
  quote: string;
  seed: string;
}

export const REVIEWS: Review[] = [
  {
    name: "Jamie Bonnen",
    role: "Founder, Northwind",
    quote:
      "Inboxly clears my inbox before my coffee's done. The summaries are scary-accurate and the drafts barely need edits.",
    seed: "Jamie Bonnen",
  },
  {
    name: "Sue Gardner",
    role: "Operations Lead",
    quote:
      "Scheduling used to be five emails. Now it's one sentence. It's the first AI tool that actually saved me time.",
    seed: "Sue Gardner",
  },
  {
    name: "Aom Sober",
    role: "Visiting Professor",
    quote:
      "I live in email. Having search, summaries, and my calendar in one place changed how I plan my whole week.",
    seed: "Aom Sober",
  },
];

export interface PricingTier {
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

export const PRICING: PricingTier[] = [
  {
    name: "Free",
    description: "For individuals getting started.",
    price: "₹0",
    period: "/mo",
    features: [
      "Gmail & Calendar sync",
      "50 chats / month (5 messages each)",
      "Inbox summaries",
      "Smart search",
    ],
    cta: "Get Started Free",
  },
  {
    name: "Pro",
    description: "For professionals who live in their inbox.",
    price: "₹300",
    period: "/mo",
    features: [
      "Everything in Free",
      "Unlimited chats & messages",
      "Smart scheduling & Meet links",
      "Priority email drafting",
      "Saved tones & templates",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Team",
    description: "For teams that coordinate all day.",
    price: "₹500",
    period: "/mo",
    features: [
      "Everything in Pro",
      "Shared scheduling",
      "Team meeting coordination",
      "Admin & roles",
      "Priority support",
    ],
    cta: "Get Started",
  },
];

export interface FooterColumn {
  title: string;
  links: string[];
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  { title: "Product", links: ["Features", "Pricing", "Integrations", "Changelog"] },
  { title: "Resources", links: ["About", "Blog", "Community", "Docs"] },
  { title: "Company", links: ["Careers", "Customers", "Legal", "Contact Us"] },
];
