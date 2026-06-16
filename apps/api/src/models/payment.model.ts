import { db } from "../db/client.js";
import { payments } from "../db/schema/index.js";

export interface CreatePaymentInput {
  plan: string;
  amountCents: number;
  cardBrand: string | null;
  cardLast4: string | null;
}

export const paymentModel = {
  async create(userId: number, input: CreatePaymentInput): Promise<void> {
    await db.insert(payments).values({ userId, ...input });
  },
};
