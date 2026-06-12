import { Router } from "express";
import {
  connectGoogleIntegration,
  getIntegrationStatus,
  googleOAuthCallback,
} from "../controllers/integration.controller.js";
import { attachUser, requireAuthenticated } from "../middleware/auth.js";

export const integrationRouter = Router();

// Google redirects here directly (no session cookie guaranteed cross-site),
// so the callback is unauthenticated - the tenant is recovered from the
// signed `state` parameter instead.
integrationRouter.get("/google/callback", googleOAuthCallback);

integrationRouter.use(requireAuthenticated, attachUser);

integrationRouter.get("/google/status", getIntegrationStatus);
integrationRouter.get("/google/connect/:plugin", connectGoogleIntegration);
