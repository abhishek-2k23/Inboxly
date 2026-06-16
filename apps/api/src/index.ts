import { createApp } from "./app.js";
import { env } from "./env.js";
import { initCorsair } from "./lib/corsair.js";
import { calendarWatchService } from "./services/calendar-watch.service.js";
import { gmailWatchService } from "./services/gmail-watch.service.js";

const app = createApp();

await initCorsair();

const WATCH_RENEWAL_INTERVAL_MS = 12 * 60 * 60 * 1000; // twice a day, well under the 7-day expiry

/**
 * Runs both watch sweeps back-to-back rather than as four independent
 * fire-and-forget chains (registration + renewal, x2 services). Each sweep
 * already throttles its own per-user Google API calls (see
 * WATCH_SWEEP_DELAY_MS in the services), but running all four concurrently
 * on every boot/restart was still enough simultaneous traffic to trip
 * Google's rate limit - this keeps it to one sweep in flight at a time.
 */
async function runWatchSweeps(): Promise<void> {
  if (env.gmailPubsubTopic) {
    await gmailWatchService.registerMissingWatches().catch((error) => {
      console.error("[gmail-watch] Registration sweep failed:", error);
    });
    await gmailWatchService.renewExpiringWatches().catch((error) => {
      console.error("[gmail-watch] Renewal sweep failed:", error);
    });
  }

  if (env.apiBaseUrl.startsWith("https://")) {
    await calendarWatchService.registerMissingWatches().catch((error) => {
      console.error("[calendar-watch] Registration sweep failed:", error);
    });
    await calendarWatchService.renewExpiringWatches().catch((error) => {
      console.error("[calendar-watch] Renewal sweep failed:", error);
    });
  }
}

void runWatchSweeps();
setInterval(() => void runWatchSweeps(), WATCH_RENEWAL_INTERVAL_MS);

app.listen(env.port, () => {
  console.log(`API server listening on port ${env.port}`);
});
