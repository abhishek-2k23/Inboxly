import { create } from "zustand";
import type { ChatMessage } from "@/types";
import { sendChatMessage } from "@/lib/api";

interface Conversation {
  id: number;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

interface ChatState {
  conversations: Conversation[];
  activeId: number | null;
  sending: boolean;
  activeMessages: () => ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  newChat: () => void;
  selectChat: (id: number) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeId: null,
  sending: false,

  activeMessages: () => {
    const { conversations, activeId } = get();
    return conversations.find((c) => c.id === activeId)?.messages ?? [];
  },

  newChat: () => set({ activeId: null }),

  selectChat: (id) => set({ activeId: id }),

  sendMessage: async (content) => {
    const state = get();
    const userMsg: ChatMessage = { role: "user", content };
    const history = state.activeMessages();
    const messages: ChatMessage[] = [...history, userMsg];

    // Optimistically add user message
    if (state.activeId !== null) {
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === s.activeId
            ? { ...c, messages: [...c.messages, userMsg], updatedAt: new Date().toISOString() }
            : c,
        ),
      }));
    }

    set({ sending: true });
    try {
      const res = await sendChatMessage(messages, state.activeId ?? undefined);
      const now = new Date().toISOString();

      set((s) => {
        const existing = s.conversations.find((c) => c.id === res.conversationId);
        if (existing) {
          return {
            activeId: res.conversationId,
            conversations: s.conversations.map((c) =>
              c.id === res.conversationId
                ? { ...c, messages: [...messages, res.message], updatedAt: now }
                : c,
            ),
          };
        }
        // New conversation
        const title = content.slice(0, 48) + (content.length > 48 ? "…" : "");
        return {
          activeId: res.conversationId,
          conversations: [
            { id: res.conversationId, title, messages: [...messages, res.message], updatedAt: now },
            ...s.conversations,
          ],
        };
      });
    } catch (err) {
      // Roll back optimistic update on error
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === s.activeId ? { ...c, messages: c.messages.slice(0, -1) } : c,
        ),
      }));
      throw err;
    } finally {
      set({ sending: false });
    }
  },
}));
