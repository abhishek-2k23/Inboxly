import type { UserRecord } from "../models/user.model.js";

declare global {
  namespace Express {
    interface Request {
      localUser?: UserRecord;
    }
  }
}

export {};
