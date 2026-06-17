import { IntegrationGate } from "@/components/dashboard/ConnectPrompt";
import { SentView } from "@/components/inbox/SentView";

export default function SentPage() {
  return (
    <IntegrationGate requires={["gmail"]}>
      <SentView />
    </IntegrationGate>
  );
}
