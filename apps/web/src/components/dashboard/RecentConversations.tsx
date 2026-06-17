"use client";

import { ArrowRight } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { relativeTime } from "@/lib/ui";

/** Up to 3 most-recent conversations beneath the prompt, with a "show all" link. */
export function RecentConversations({ onShowAll }: { onShowAll: () => void }) {
  const conversations = useChatStore((s) => s.conversations);
  const selectChat = useChatStore((s) => s.selectChat);

  const recent = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3);
  if (recent.length === 0) return null;

  return (
    <div className="w-full">
      <p className="text-ink-3 mb-1 px-1 text-xs font-medium uppercase tracking-wide">Recent</p>
      <ul>
        {recent.map((conversation) => (
          <li key={conversation.id} className="border-line border-b last:border-b-0">
            <button
              type="button"
              onClick={() => selectChat(conversation.id)}
              className="hover:bg-surface group flex w-full items-center justify-between gap-3 rounded-md px-1 py-2.5 text-left transition-colors"
            >
              <span className="text-ink-2 group-hover:text-ink truncate text-sm transition-colors">
                {conversation.title}
              </span>
              <span className="text-ink-3 shrink-0 text-xs">
                {relativeTime(String(conversation.updatedAt))}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onShowAll}
        className="text-ink-2 hover:text-ink mt-2 inline-flex items-center gap-1 px-1 text-xs font-medium transition-colors"
      >
        Show all conversations
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
