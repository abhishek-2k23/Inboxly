import { Inbox } from "lucide-react";
import { Placeholder } from "@/components/dashboard/Placeholder";

export default function InboxPage() {
  return (
    <Placeholder
      icon={Inbox}
      title="Inbox"
      description="Your synced email, triaged by priority. We're putting the finishing touches on it."
    />
  );
}
