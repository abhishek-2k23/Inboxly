import {
  CalendarClock,
  DollarSign,
  PackageSearch,
  PenLine,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

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
    title: "Summarize Inbox",
    description: "Get a crisp digest of your latest emails — who sent what and what needs a reply.",
    prompt: "Summarize my last 5 emails and tell me which ones need a reply.",
  },
  {
    icon: CalendarClock,
    title: "Find Free Time",
    description:
      "Ask for your free slots in a day, week, or month — then book right from the answer.",
    prompt: "Find my free schedule for this week and suggest the best time for a 1-hour meeting.",
  },
  {
    icon: DollarSign,
    title: "Track Expenses",
    description:
      "Scan your inbox for invoices and receipts, then get a running total with a breakdown.",
    prompt: "Find all invoice and payment emails and calculate how much I've spent in total.",
  },
  {
    icon: PackageSearch,
    title: "Upcoming Deliveries",
    description:
      "Spot all shipping and order confirmation emails and list delivery dates in order.",
    prompt: "Find my upcoming deliveries this month from my emails.",
  },
];

/** Quick-action chips on the empty state. */
export const SUGGESTIONS: string[] = [
  "Summarize my unread emails",
  "What's on my calendar this week?",
  "Find free slots for a meeting tomorrow",
  "Any invoices or payments in my inbox?",
  "Show upcoming deliveries from my emails",
  "Draft a follow-up to the latest email",
];

/** Example Q&A pairs shown as conversation starters — also injected as few-shot examples in the system prompt. */
export const FEW_SHOT_EXAMPLES = [
  {
    user: "Summarize my last 5 emails",
    assistant: `Here are your **5 most recent emails**:

1. **Re: Q3 Budget Review** — From: **Sarah Chen** — _Approved the revised forecast; wants sign-off by Friday._
2. **Invoice #INV-2047** — From: **Acme Corp** — _₹12,400 due in 14 days for the June hosting subscription._
3. **Your order has shipped!** — From: **Amazon** — _iPhone case dispatched, arriving Jun 27 via Blue Dart (TRK: 4921837465)._
4. **Team Standup Notes** — From: **Rohan Mehta** — _Shared yesterday's standup notes; three open action items tagged to you._
5. **Coffee chat?** — From: **Priya Nair** — _Asking if you're free this Thursday afternoon for a 30-minute catch-up._

Would you like me to **reply** to any of these or **archive** the ones you're done with?`,
  },
  {
    user: "Find all expenses and calculate the total",
    assistant: `I found **6 invoice and payment emails** in your inbox:

| Date | Sender | Description | Amount |
|------|--------|-------------|--------|
| Jun 18 | Acme Corp | Invoice #INV-2047 — Hosting | ₹12,400 |
| Jun 12 | Notion | Monthly Pro subscription | ₹800 |
| Jun 10 | AWS | Cloud usage — May billing | ₹4,230 |
| Jun 5 | Figma | Team plan renewal | ₹2,100 |
| May 28 | Razorpay | Payment gateway fee | ₹340 |
| May 22 | Zepto | Office groceries order | ₹1,850 |

**Total: ₹21,720**

> ⚠️ The Acme Corp invoice (₹12,400) is **due in 14 days** — June 30.

Want me to draft a payment confirmation or set a calendar reminder for the due date?`,
  },
  {
    user: "Find my free schedule this week",
    assistant: `Here are your **free slots this week** (Mon Jun 23 – Fri Jun 27), based on your calendar:

**Mon Jun 23**
• 09:00–10:30 _(1.5 h)_
• 13:00–14:00 _(1 h)_
• 16:00–18:00 _(2 h)_

**Tue Jun 24**
• 09:00–11:00 _(2 h)_
• 15:30–18:00 _(2.5 h)_

**Wed Jun 25** — _Mostly booked_
• 12:00–13:00 _(1 h lunch slot)_

**Thu Jun 26**
• 09:00–10:00 _(1 h)_
• 14:00–16:30 _(2.5 h)_

**Fri Jun 27**
• 09:00–12:00 _(3 h)_
• 14:30–18:00 _(3.5 h)_

Your most open day is **Friday**. Want me to schedule something in one of these slots?`,
  },
  {
    user: "Show my upcoming deliveries",
    assistant: `I found **4 upcoming deliveries** from your inbox:

1. 📦 **iPhone 15 Case** — Amazon
   Arriving **Jun 27** via Blue Dart · TRK: 4921837465

2. 📦 **Mechanical Keyboard (Keychron K2)** — Flipkart
   Arriving **Jun 28** via Ekart · TRK: FKMP9183746

3. 📦 **Protein Powder (2 kg)** — Healthkart
   Arriving **Jun 30** via Delhivery · Order #HK-298371

4. 📦 **HDMI Cable (2-pack)** — Myntra
   Arriving **Jul 3** via Bluedart · Order #MYN-48271839

All deliveries are **on time**. Want me to add delivery reminders to your calendar?`,
  },
];
