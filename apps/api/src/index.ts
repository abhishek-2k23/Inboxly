import { createApp } from "./app.js";
import { env } from "./env.js";
import { initCorsair } from "./lib/corsair.js";
import { calendarWatchService } from "./services/calendar-watch.service.js";
import { gmailWatchService } from "./services/gmail-watch.service.js";

const app = createApp();

await initCorsair();

const GMAIL_WATCH_RENEWAL_INTERVAL_MS = 12 * 60 * 60 * 1000; // twice a day, well under the 7-day expiry
const CALENDAR_WATCH_RENEWAL_INTERVAL_MS = 12 * 60 * 60 * 1000; // twice a day, well under the 7-day expiry

if (env.gmailPubsubTopic) {
  gmailWatchService.registerMissingWatches().catch((error) => {
    console.error("[gmail-watch] Initial registration check failed:", error);
  });
  gmailWatchService.renewExpiringWatches().catch((error) => {
    console.error("[gmail-watch] Initial renewal check failed:", error);
  });
  setInterval(() => {
    gmailWatchService.registerMissingWatches().catch((error) => {
      console.error("[gmail-watch] Scheduled registration check failed:", error);
    });
    gmailWatchService.renewExpiringWatches().catch((error) => {
      console.error("[gmail-watch] Scheduled renewal check failed:", error);
    });
  }, GMAIL_WATCH_RENEWAL_INTERVAL_MS);
}

if (env.apiBaseUrl.startsWith("https://")) {
  calendarWatchService.registerMissingWatches().catch((error) => {
    console.error("[calendar-watch] Initial registration check failed:", error);
  });
  calendarWatchService.renewExpiringWatches().catch((error) => {
    console.error("[calendar-watch] Initial renewal check failed:", error);
  });
  setInterval(() => {
    calendarWatchService.registerMissingWatches().catch((error) => {
      console.error("[calendar-watch] Scheduled registration check failed:", error);
    });
    calendarWatchService.renewExpiringWatches().catch((error) => {
      console.error("[calendar-watch] Scheduled renewal check failed:", error);
    });
  }, CALENDAR_WATCH_RENEWAL_INTERVAL_MS);
}

app.listen(env.port, () => {
  console.log(`API server listening on port ${env.port}`);
});
