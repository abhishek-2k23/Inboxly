import { getAuth } from "@clerk/express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/openai.js", () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { role: "assistant", content: "Hello!" } }],
        }),
      },
    },
  },
}));

vi.mock("../services/user.service.js", () => ({
  userService: {
    getOrCreateByClerkId: vi.fn().mockResolvedValue({
      id: 1,
      clerkId: "user_test123",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      imageUrl: null,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    }),
  },
}));

vi.mock("../models/chat.model.js", () => ({
  chatModel: {
    getOrCreateConversation: vi.fn().mockResolvedValue(1),
    addMessage: vi.fn().mockResolvedValue(undefined),
    getConversationMessages: vi.fn().mockResolvedValue([{ role: "user", content: "Hi" }]),
  },
}));

const { createApp } = await import("../app.js");

describe("POST /api/chat", () => {
  it("rejects unauthenticated requests", async () => {
    vi.mocked(getAuth).mockReturnValueOnce({ userId: null } as never);

    const app = createApp();
    const res = await request(app)
      .post("/api/chat")
      .send({ messages: [{ role: "user", content: "Hi" }] });

    expect(res.status).toBe(401);
  });

  it("returns the assistant message from the AI provider", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/chat")
      .send({ messages: [{ role: "user", content: "Hi" }] });

    expect(res.status).toBe(200);
    expect(res.body.message).toEqual({ role: "assistant", content: "Hello!" });
    expect(res.body.conversationId).toBe(1);
  });

  it("rejects an empty messages array", async () => {
    const app = createApp();
    const res = await request(app).post("/api/chat").send({ messages: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
