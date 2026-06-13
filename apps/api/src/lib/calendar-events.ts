import type { Response } from "express";

export interface CalendarUpdateEvent {
  type: "calendar-updated";
  synced: number;
  embedded: number;
}

const subscribers = new Map<number, Set<Response>>();

export const calendarEvents = {
  subscribe(userId: number, res: Response): void {
    let sockets = subscribers.get(userId);
    if (!sockets) {
      sockets = new Set();
      subscribers.set(userId, sockets);
    }
    sockets.add(res);
  },

  unsubscribe(userId: number, res: Response): void {
    const sockets = subscribers.get(userId);
    if (!sockets) return;
    sockets.delete(res);
    if (sockets.size === 0) subscribers.delete(userId);
  },

  publish(userId: number, event: CalendarUpdateEvent): void {
    const sockets = subscribers.get(userId);
    if (!sockets) return;

    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const res of sockets) {
      res.write(payload);
    }
  },
};
