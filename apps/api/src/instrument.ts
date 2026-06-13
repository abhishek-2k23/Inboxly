import * as Sentry from "@sentry/node";
import { env } from "./env.js";

if (env.sentryDsn) {
  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.nodeEnv,
    tracesSampleRate: env.sentryTracesSampleRate,
    sendDefaultPii: true,
  });
}
