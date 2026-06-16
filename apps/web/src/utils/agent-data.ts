import { CalendarClock, PenLine, Search, Sparkles, type LucideIcon } from "lucide-react";

export interface AgentCapability {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Prefilled into the prompt when the card/chip is clicked. */
  prompt: string;
}

export const CAPABILITIES: AgentCapability[] = [
  {
    icon: Sparkles,
    title: "Summarize Daily Emails",
    description: "Get a crisp digest of what landed today, grouped by what needs you first.",
    prompt: "Summarize my emails from today and tell me what needs a reply.",
  },
  {
    icon: PenLine,
    title: "Draft Immediate Replies",
    description: "Turn a one-line instruction into a polished, ready-to-send reply.",
    prompt: "Draft a reply to my latest email.",
  },
  {
    icon: CalendarClock,
    title: "Smart Schedule Meetings",
    description: "Create events from a sentence — time, guests, and a Meet link handled.",
    prompt: "Schedule a 30-minute meeting tomorrow at 3pm.",
  },
  {
    icon: Search,
    title: "Search Across Workspace",
    description: "Find any email or event by topic or sender, even without the keywords.",
    prompt: "Find the most recent email about an invoice.",
  },
];

/** The three quick-action chips shown when there's no conversation history yet. */
export const SUGGESTIONS: string[] = [
  "Summarize my unread emails",
  "What's on my calendar this week?",
  "Draft a follow-up to the design team",
];
