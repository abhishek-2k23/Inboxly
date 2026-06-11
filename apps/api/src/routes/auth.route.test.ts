import { verifyWebhook } from "@clerk/express/webhooks";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

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
    syncFromWebhookEvent: vi.fn().mockResolvedValue(undefined),
  },
}));

const { createApp } = await import("../app.js");
const { userService } = await import("../services/user.service.js");

describe("GET /api/auth/me", () => {
  it("returns the current user", async () => {
    const app = createApp();
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: 1,
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      imageUrl: null,
    });
  });
});

describe("POST /api/webhooks/clerk", () => {
  it("syncs the user on a user.created event", async () => {
    vi.mocked(verifyWebhook).mockResolvedValueOnce({
      type: "user.created",
      object: "event",
      data: {
        id: "user_123",
        email_addresses: [],
        first_name: null,
        last_name: null,
        image_url: "",
      },
      event_attributes: { http_request: { client_ip: "", user_agent: "" } },
    } as never);

    const app = createApp();
    const res = await request(app).post("/api/webhooks/clerk").send({});

    expect(res.status).toBe(200);
    expect(userService.syncFromWebhookEvent).toHaveBeenCalled();
  });

  it("returns 400 when signature verification fails", async () => {
    vi.mocked(verifyWebhook).mockRejectedValueOnce(new Error("invalid signature"));

    const app = createApp();
    const res = await request(app).post("/api/webhooks/clerk").send({});

    expect(res.status).toBe(400);
  });
});
