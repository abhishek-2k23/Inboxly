/** Awaitable delay, used to space out batched external API calls (e.g. Google watch sweeps). */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
