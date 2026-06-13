import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";

describe("GET /api/health", () => {
  it("returns ok status with uptime", async () => {
    const app = createApp();
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.uptime).toBe("number");
  });
});
