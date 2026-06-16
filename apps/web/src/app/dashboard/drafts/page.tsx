import { IntegrationGate } from "@/components/dashboard/ConnectPrompt";
import { DraftsView } from "@/components/inbox/DraftsView";

export default function DraftsPage() {
  return (
    <IntegrationGate requires={["gmail"]}>
      <DraftsView />
    </IntegrationGate>
  );
}
