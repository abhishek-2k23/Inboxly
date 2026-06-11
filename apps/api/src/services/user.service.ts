import { clerkClient } from "@clerk/express";
import type { UserWebhookEvent } from "@clerk/express/webhooks";
import { userModel, type UserRecord } from "../models/user.model.js";

function primaryEmailAddress(
  emailAddresses: { id: string; emailAddress: string }[],
  primaryEmailAddressId: string | null,
): string {
  return (
    emailAddresses.find((email) => email.id === primaryEmailAddressId)?.emailAddress ??
    emailAddresses[0]?.emailAddress ??
    ""
  );
}

export const userService = {
  async getOrCreateByClerkId(clerkId: string): Promise<UserRecord> {
    const existing = await userModel.findByClerkId(clerkId);
    if (existing) {
      return existing;
    }

    const clerkUser = await clerkClient.users.getUser(clerkId);
    return userModel.upsert({
      clerkId: clerkUser.id,
      email: primaryEmailAddress(clerkUser.emailAddresses, clerkUser.primaryEmailAddressId),
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    });
  },

  async syncFromWebhookEvent(event: UserWebhookEvent): Promise<void> {
    if (event.type === "user.deleted") {
      if (event.data.id) {
        await userModel.deleteByClerkId(event.data.id);
      }
      return;
    }

    const user = event.data;
    await userModel.upsert({
      clerkId: user.id,
      email: primaryEmailAddress(
        (user.email_addresses ?? []).map((email) => ({ id: email.id, emailAddress: email.email_address })),
        user.primary_email_address_id,
      ),
      firstName: user.first_name,
      lastName: user.last_name,
      imageUrl: user.image_url,
    });
  },
};
