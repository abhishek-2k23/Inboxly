import type { Ionicons } from "@expo/vector-icons";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export interface AgentCapability {
  icon: IoniconName;
  title: string;
  /** Prefilled into the prompt when the card is tapped. */
  prompt: string;
}

/** Mirrors apps/web/src/utils/agent-data.ts CAPABILITIES. */
export const CAPABILITIES: AgentCapability[] = [
  {
    icon: "sparkles-outline",
    title: "Summarize daily emails",
    prompt: "Summarize my emails from today and tell me what needs a reply.",
  },
  {
    icon: "create-outline",
    title: "Draft immediate replies",
    prompt: "Draft a reply to my latest email.",
  },
  {
    icon: "calendar-outline",
    title: "Smart schedule meetings",
    prompt: "Schedule a 30-minute meeting tomorrow at 3pm.",
  },
  {
    icon: "search-outline",
    title: "Search your workspace",
    prompt: "Find the most recent email about an invoice.",
  },
];

/** Quick-action chips shown when there's no conversation history yet. */
export const SUGGESTIONS: string[] = [
  "Summarize my unread emails",
  "What's on my calendar this week?",
  "Draft a follow-up to the design team",
];
