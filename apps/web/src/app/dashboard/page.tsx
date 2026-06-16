import { AgentView } from "@/components/dashboard/AgentView";
import { IntegrationGate } from "@/components/dashboard/ConnectPrompt";

export default function DashboardPage() {
  return (
    <IntegrationGate requires={["gmail", "googlecalendar"]}>
      <AgentView />
    </IntegrationGate>
  );
}
