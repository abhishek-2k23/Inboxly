import { IntegrationGate } from "@/components/dashboard/ConnectPrompt";
import { InboxView } from "@/components/inbox/InboxView";

export default function InboxPage() {
  return (
    <IntegrationGate requires={["gmail"]}>
      <InboxView />
    </IntegrationGate>
  );
}
