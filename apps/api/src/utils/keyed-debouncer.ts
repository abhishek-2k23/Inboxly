/**
 * Per-key debouncer that coalesces rapid-fire triggers into a single run,
 * instead of running once per trigger. Used by the Gmail/Calendar webhook
 * handlers to collapse a burst of change notifications for the same user
 * (Gmail fires on every history change - reads, archives, stars, not just
 * new mail) into one sync, instead of one full Gmail/Calendar API sync per
 * notification.
 *
 * Behavior:
 * - The first trigger for a key starts a `delayMs` timer; a run fires once
 *   that elapses, using whatever payload was *last* set for that key (so a
 *   burst of triggers in the window collapses to one run with the latest
 *   payload, not one run per trigger).
 * - A trigger that arrives while a run is already in flight doesn't queue a
 *   second concurrent run - it's recorded and a single follow-up run is
 *   scheduled (after another `delayMs`) once the current one finishes, so
 *   nothing is lost but runs never overlap and are never back-to-back.
 */
export function createKeyedDebouncer<K extends string | number, P = void>(
  run: (key: K, payload: P) => Promise<void>,
  delayMs: number,
) {
  interface KeyState {
    timer: ReturnType<typeof setTimeout> | null;
    running: boolean;
    hasPending: boolean;
    pending: P | undefined;
  }

  const states = new Map<K, KeyState>();

  function getState(key: K): KeyState {
    let state = states.get(key);
    if (!state) {
      state = { timer: null, running: false, hasPending: false, pending: undefined };
      states.set(key, state);
    }
    return state;
  }

  function scheduleRun(key: K): void {
    const state = getState(key);
    state.timer = setTimeout(() => {
      state.timer = null;
      void execute(key);
    }, delayMs);
  }

  async function execute(key: K): Promise<void> {
    const state = getState(key);
    state.running = true;
    const payload = state.pending as P;
    state.hasPending = false;
    state.pending = undefined;

    try {
      await run(key, payload);
    } finally {
      state.running = false;
      if (state.hasPending) {
        scheduleRun(key);
      } else {
        states.delete(key);
      }
    }
  }

  function trigger(key: K, payload?: P): void {
    const state = getState(key);
    state.pending = payload as P;
    state.hasPending = true;

    if (state.running || state.timer) return; // already scheduled/running - it'll pick up this payload
    scheduleRun(key);
  }

  return { trigger };
}
