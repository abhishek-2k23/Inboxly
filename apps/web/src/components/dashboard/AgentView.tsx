"use client";

import { useUser } from "@clerk/nextjs";
import { PanelRight, SquarePen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/toast";
import { ChatStream } from "@/components/dashboard/ChatStream";
import { FeatureGrid } from "@/components/dashboard/FeatureGrid";
import { HistorySidebar } from "@/components/dashboard/HistorySidebar";
import { PromptBox } from "@/components/dashboard/PromptBox";
import { RecentConversations } from "@/components/dashboard/RecentConversations";
import { SuggestionChips } from "@/components/dashboard/SuggestionChips";
import { consumeChatUsage, PlanLimitError } from "@/lib/api";
import { useChatStore } from "@/stores/chat-store";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { cn } from "@/lib/ui";

export function AgentView() {
  const { user } = useUser();
  const toast = useToast();
  const [input, setInput] = useState("");

  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeId);
  const pending = useChatStore((s) => s.pending);
  const sending = useChatStore((s) => s.sending);
  const streamingId = useChatStore((s) => s.streamingId);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const clearStreaming = useChatStore((s) => s.clearStreaming);
  const newChat = useChatStore((s) => s.newChat);

  const historyOpen = useDashboardStore((s) => s.historyOpen);
  const toggleHistory = useDashboardStore((s) => s.toggleHistory);
  const setHistory = useDashboardStore((s) => s.setHistory);
  const setSubscription = useSubscriptionStore((s) => s.set);
  const router = useRouter();

  const activeMessages =
    activeId !== null ? (conversations.find((c) => c.id === activeId)?.messages ?? []) : pending;
  const chatMode = activeMessages.length > 0;

  const firstName = user?.firstName?.trim();

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    // Enforce plan limits from the cached subscription snapshot before spending a request.
    const sub = useSubscriptionStore.getState().data;
    const isNewConversation = activeId === null;
    const atLimit = (used: number, limit: number) => limit >= 0 && used >= limit;

    if (sub) {
      if (atLimit(sub.usage.chats, sub.limits.chats)) {
        toast.error(
          `You've reached your plan's chat limit (${sub.limits.chats}). Upgrade to continue.`,
        );
        router.push("/dashboard/settings/plan");
        return;
      }
      if (isNewConversation && atLimit(sub.usage.conversations, sub.limits.conversations)) {
        toast.error(
          `Free plan allows ${sub.limits.conversations} conversations. Upgrade for unlimited.`,
        );
        router.push("/dashboard/settings/plan");
        return;
      }
    }

    setInput("");
    try {
      await sendMessage(text);
      try {
        setSubscription(await consumeChatUsage(isNewConversation));
      } catch (err) {
        if (err instanceof PlanLimitError) {
          toast.info("You've reached your plan limit. Upgrade for unlimited access.");
        }
      }

      const state = useChatStore.getState();
      const conv = state.conversations.find((c) => c.id === state.activeId);
      const events = conv?.messages[conv.messages.length - 1]?.events;
      if (events && events.length > 0) {
        toast.success(
          `Added ${events.length} event${events.length === 1 ? "" : "s"} to your calendar`,
        );
      }
    } catch {
      toast.error("Couldn't reach the assistant. Please try again.");
      setInput(text);
    }
  }

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Minimal top-right controls — no full nav bar. */}
        <div className="flex h-12 shrink-0 items-center justify-end gap-1 px-3">
          <button
            type="button"
            aria-label="New chat"
            title="New chat"
            onClick={() => {
              newChat();
              setInput("");
            }}
            className="text-ink-2 hover:bg-surface hover:text-ink grid h-9 w-9 place-items-center rounded-lg transition-colors"
          >
            <SquarePen className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            aria-label="Toggle conversation history"
            title="Conversation history"
            onClick={toggleHistory}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-lg transition-colors",
              historyOpen ? "bg-surface text-ink" : "text-ink-2 hover:bg-surface hover:text-ink",
            )}
          >
            <PanelRight className="h-[18px] w-[18px]" />
          </button>
        </div>

        {chatMode ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ChatStream
                messages={activeMessages}
                sending={sending}
                streamingId={streamingId}
                onStreamDone={clearStreaming}
              />
            </div>
            <div className="shrink-0 px-4 pb-5">
              <div className="mx-auto max-w-3xl">
                <PromptBox
                  value={input}
                  onChange={setInput}
                  onSubmit={handleSend}
                  disabled={sending}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-6">
            <div className="flex w-full max-w-2xl flex-col items-center gap-8">
              <div className="text-center">
                <h1 className="text-ink text-3xl font-semibold tracking-tight sm:text-4xl">
                  Welcome back{firstName ? `, ${firstName}` : ""}
                </h1>
                <p className="text-ink-2 mt-2">Let&apos;s clear the clutter today.</p>
              </div>

              <FeatureGrid onPick={setInput} />

              <div className="w-full">
                <PromptBox
                  value={input}
                  onChange={setInput}
                  onSubmit={handleSend}
                  disabled={sending}
                  autoFocus
                />
              </div>

              <div className="w-full">
                {conversations.length === 0 ? (
                  <div className="flex justify-center">
                    <SuggestionChips onPick={setInput} />
                  </div>
                ) : (
                  <RecentConversations onShowAll={() => setHistory(true)} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {historyOpen && <HistorySidebar />}
    </div>
  );
}
