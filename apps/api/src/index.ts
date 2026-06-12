import { createApp } from "./app.js";
import { env } from "./env.js";
import { initCorsair } from "./lib/corsair.js";

const app = createApp();

await initCorsair();

app.listen(env.port, () => {
  console.log(`API server listening on port ${env.port}`);
});
