import { getAuth } from "@clerk/express";
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
  },
}));

vi.mock("../services/item.service.js", () => ({
  itemService: {
    listForUser: vi.fn().mockResolvedValue([
      { id: 1, name: "Item 1", userId: 1, createdAt: "2024-01-01T00:00:00.000Z" },
    ]),
    create: vi.fn().mockImplementation((userId: number, name: string) =>
      Promise.resolve({ id: 2, name, userId, createdAt: "2024-01-02T00:00:00.000Z" }),
    ),
  },
}));

const { createApp } = await import("../app.js");

describe("GET /api/items", () => {
  it("rejects unauthenticated requests", async () => {
    vi.mocked(getAuth).mockReturnValueOnce({ userId: null } as never);

    const app = createApp();
    const res = await request(app).get("/api/items");

    expect(res.status).toBe(401);
  });

  it("lists items for the authenticated user", async () => {
    const app = createApp();
    const res = await request(app).get("/api/items");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, name: "Item 1", createdAt: "2024-01-01T00:00:00.000Z" }]);
  });
});

describe("POST /api/items", () => {
  it("creates an item for the authenticated user", async () => {
    const app = createApp();
    const res = await request(app).post("/api/items").send({ name: "New item" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 2, name: "New item", createdAt: "2024-01-02T00:00:00.000Z" });
  });

  it("rejects an empty name", async () => {
    const app = createApp();
    const res = await request(app).post("/api/items").send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
