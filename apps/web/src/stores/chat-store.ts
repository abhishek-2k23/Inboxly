import type { CalendarEventSummary, EmailAttachment, EmailRef } from "@repo/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { listConversations, sendChatMessage } from "@/lib/api";

export interface ChatStoreMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Calendar events the agent created on this turn, surfaced in the UI. */
  events?: CalendarEventSummary[];
  /** Emails the agent read to answer this turn — shown as source links. */
  referencedEmails?: EmailRef[];
  isError?: boolean;
}

export interface Conversation {
  /** Server-assigned conversation id (from /api/chat). */
  id: number;
  title: string;
  messages: ChatStoreMessage[];
  updatedAt: number;
}

interface ChatState {
  conversations: Conversation[];
  /** Active conversation id, or null while composing a brand-new chat. */
  activeId: number | null;
  /** Messages for the in-progress new chat before the server assigns an id. */
  pending: ChatStoreMessage[];
  sending: boolean;
  /** Id of the message currently being "typed out" (typewriter effect). */
  streamingId: string | null;

  newChat: () => void;
  selectChat: (id: number) => void;
  deleteChat: (id: number) => void;
  sendMessage: (
    content: string,
    attachments?: EmailAttachment[],
  ) => Promise<{ emailSent: boolean }>;
  clearStreaming: () => void;
  syncWithServer: () => Promise<void>;
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function titleFrom(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return trimmed.length > 48 ? `${trimmed.slice(0, 45)}…` : trimmed || "New conversation";
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeId: null,
      pending: [],
      sending: false,
      streamingId: null,

      newChat: () => set({ activeId: null, pending: [] }),

      selectChat: (id) => set({ activeId: id, pending: [] }),

      deleteChat: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeId: state.activeId === id ? null : state.activeId,
          pending: state.activeId === id ? [] : state.pending,
        })),

      clearStreaming: () => set({ streamingId: null }),

      syncWithServer: async () => {
        try {
          const { conversations: serverConvs } = await listConversations();
          if (serverConvs.length === 0) return;
          const merged: Conversation[] = serverConvs.map((sc) => {
            const existing = get().conversations.find((c) => c.id === sc.id);
            const messages: ChatStoreMessage[] = sc.messages
              .filter((m) => m.role === "user" || m.role === "assistant")
              .map((m, idx) => ({
                id: existing?.messages[idx]?.id ?? `${sc.id}-${idx}-${m.role}`,
                role: m.role as "user" | "assistant",
                content: m.content,
                events: existing?.messages[idx]?.events,
                referencedEmails: existing?.messages[idx]?.referencedEmails,
              }));
            return {
              id: sc.id,
              title: sc.title ?? messages[0]?.content?.slice(0, 48) ?? "Conversation",
              messages,
              updatedAt: new Date(sc.updatedAt).getTime(),
            };
          });
          set({ conversations: merged });
        } catch {
          // ignore — localStorage data is good enough for now
        }
      },

      sendMessage: async (content, attachments) => {
        const text = content.trim();
        if (!text || get().sending) return { emailSent: false };

        const { activeId, conversations } = get();
        const userMessage: ChatStoreMessage = { id: newId(), role: "user", content: text };

        // Optimistically show the user's message.
        if (activeId === null) {
          set((s) => ({ pending: [...s.pending, userMessage], sending: true }));
        } else {
          set((s) => ({
            conversations: s.conversations.map((c) =>
              c.id === activeId
                ? { ...c, messages: [...c.messages, userMessage], updatedAt: Date.now() }
                : c,
            ),
            sending: true,
          }));
        }

        // Build the thread to send (the API only needs the latest user turn when
        // a conversationId is supplied; for a new chat it derives a title).
        const thread =
          activeId === null
            ? [...get().pending]
            : [...(conversations.find((c) => c.id === activeId)?.messages ?? [])];
        const apiMessages = thread.map(({ role, content }) => ({ role, content }));

        try {
          const res = await sendChatMessage(apiMessages, activeId ?? undefined, attachments);
          const assistant: ChatStoreMessage = {
            id: newId(),
            role: "assistant",
            content: res.message.content,
            events: res.calendarEvents,
            referencedEmails: res.referencedEmails,
          };

          set((s) => {
            const exists = s.conversations.some((c) => c.id === res.conversationId);
            if (s.activeId === null && !exists) {
              const conversation: Conversation = {
                id: res.conversationId,
                title: titleFrom(text),
                messages: [...s.pending, assistant],
                updatedAt: Date.now(),
              };
              return {
                conversations: [conversation, ...s.conversations],
                activeId: res.conversationId,
                pending: [],
                sending: false,
                streamingId: assistant.id,
              };
            }
            return {
              conversations: s.conversations.map((c) =>
                c.id === res.conversationId
                  ? { ...c, messages: [...c.messages, assistant], updatedAt: Date.now() }
                  : c,
              ),
              activeId: res.conversationId,
              pending: [],
              sending: false,
              streamingId: assistant.id,
            };
          });
          return { emailSent: res.emailSent ?? false };
        } catch (error) {
          const isLimitError = error instanceof Error && error.name === "PlanLimitError";
          const errText = isLimitError
            ? null // plan limit errors are handled by AgentView, not shown in chat
            : error instanceof Error && error.message.includes("502")
              ? "I couldn't reach the AI right now. Please try again in a moment."
              : "Something went wrong. Please try again.";

          if (errText) {
            const errMsg: ChatStoreMessage = {
              id: newId(),
              role: "assistant",
              content: errText,
              isError: true,
            };
            set((s) => {
              const { activeId: aid, conversations: convs, pending: pend } = s;
              if (aid === null) {
                return { pending: [...pend, errMsg], sending: false };
              }
              return {
                conversations: convs.map((c) =>
                  c.id === aid
                    ? { ...c, messages: [...c.messages, errMsg], updatedAt: Date.now() }
                    : c,
                ),
                sending: false,
              };
            });
          } else {
            set({ sending: false });
          }
          throw error;
        }
      },
    }),
    {
      name: "inboxly-chat",
      // Only conversation data is durable; transient send/stream state resets.
      partialize: (s) => ({ conversations: s.conversations, activeId: s.activeId }),
    },
  ),
);
