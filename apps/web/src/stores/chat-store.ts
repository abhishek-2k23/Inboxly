import type { CalendarEventSummary, EmailAttachment, EmailRef } from "@repo/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sendChatMessage } from "@/lib/api";

export interface ChatStoreMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Calendar events the agent created on this turn, surfaced in the UI. */
  events?: CalendarEventSummary[];
  /** Emails the agent read to answer this turn — shown as source links. */
  referencedEmails?: EmailRef[];
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
          set({ sending: false });
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
