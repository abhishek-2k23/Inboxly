import { vi } from "vitest";

vi.mock("@clerk/express", () => ({
  clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  getAuth: vi.fn(() => ({ userId: "user_test123" })),
  clerkClient: {
    users: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock("@clerk/express/webhooks", () => ({
  verifyWebhook: vi.fn(),
}));
