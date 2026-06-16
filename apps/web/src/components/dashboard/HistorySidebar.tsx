"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { useDashboardStore } from "@/stores/dashboard-store";
import { relativeTime } from "@/lib/ui";
import { cn } from "@/lib/ui";

/** Right-edge collapsible panel listing every past conversation. */
export function HistorySidebar() {
  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeId);
  const selectChat = useChatStore((s) => s.selectChat);
  const deleteChat = useChatStore((s) => s.deleteChat);
  const newChat = useChatStore((s) => s.newChat);
  const setHistory = useDashboardStore((s) => s.setHistory);

  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <aside className="border-line bg-bg-secondary animate-rise-in flex w-72 shrink-0 flex-col border-l">
      <div className="flex h-14 items-center justify-between px-4">
        <h2 className="text-ink text-sm font-semibold">Conversation History</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="New chat"
            title="New chat"
            onClick={() => newChat()}
            className="text-ink-2 hover:bg-surface-hover hover:text-ink grid h-8 w-8 place-items-center rounded-lg transition-colors"
          >
            <Plus className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            aria-label="Close history"
            onClick={() => setHistory(false)}
            className="text-ink-2 hover:bg-surface-hover hover:text-ink grid h-8 w-8 place-items-center rounded-lg transition-colors"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {sorted.length === 0 ? (
          <p className="text-ink-3 px-2 py-6 text-center text-xs">No conversations yet.</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {sorted.map((conversation) => (
              <li key={conversation.id}>
                <div
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors",
                    conversation.id === activeId ? "bg-surface" : "hover:bg-surface",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => selectChat(conversation.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p
                      className={cn(
                        "truncate text-sm",
                        conversation.id === activeId
                          ? "text-ink font-medium"
                          : "text-ink-2 group-hover:text-ink",
                      )}
                    >
                      {conversation.title}
                    </p>
                    <p className="text-ink-3 text-xs">
                      {relativeTime(String(conversation.updatedAt))}
                    </p>
                  </button>
                  <button
                    type="button"
                    aria-label="Delete conversation"
                    onClick={() => deleteChat(conversation.id)}
                    className="text-ink-3 hover:text-danger grid h-7 w-7 shrink-0 place-items-center rounded-md opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
