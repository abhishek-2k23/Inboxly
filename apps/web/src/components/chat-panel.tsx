"use client";

import { useState } from "react";
import type { ChatMessage } from "@repo/shared";
import { sendChatMessage } from "@/lib/api";

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const { message } = await sendChatMessage(nextMessages);
      setMessages([...nextMessages, message]);
    } catch {
      setError("Something went wrong talking to the API. Is apps/api running?");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex min-h-48 flex-1 flex-col gap-3 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-slate-500">
            Send a message to test the AI endpoint at{" "}
            <code className="rounded bg-slate-800 px-1 py-0.5">/api/chat</code>.
          </p>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              message.role === "user"
                ? "self-end bg-indigo-600 text-white"
                : "self-start bg-slate-800 text-slate-100"
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask the AI something..."
          className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}
