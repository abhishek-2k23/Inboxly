import "dotenv/config";

export const env = {
  port: Number(process.env.API_PORT ?? 4000),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://hackathon:hackathon_dev_password@localhost:5432/hackathon",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? "",
  clerkWebhookSigningSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET ?? "",
  apiBaseUrl: process.env.API_BASE_URL ?? "http://localhost:4000",
  webAppUrl: process.env.WEB_APP_URL ?? "http://localhost:3000",
  corsairKek: process.env.CORSAIR_KEK ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",
  sentryDsn: process.env.SENTRY_DSN ?? "",
  sentryTracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  gmailPubsubTopic: process.env.GMAIL_PUBSUB_TOPIC ?? "",
  gmailWebhookToken: process.env.GMAIL_WEBHOOK_TOKEN ?? "",
  calendarWebhookToken: process.env.CALENDAR_WEBHOOK_TOKEN ?? "",
};
