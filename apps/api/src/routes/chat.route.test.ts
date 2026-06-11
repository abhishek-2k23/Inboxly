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
  });

  it("rejects an empty messages array", async () => {
    const app = createApp();
    const res = await request(app).post("/api/chat").send({ messages: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
