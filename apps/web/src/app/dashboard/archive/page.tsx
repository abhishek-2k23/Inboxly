import { IntegrationGate } from "@/components/dashboard/ConnectPrompt";
import { ArchiveView } from "@/components/inbox/ArchiveView";

export default function ArchivePage() {
  return (
    <IntegrationGate requires={["gmail"]}>
      <ArchiveView />
    </IntegrationGate>
  );
}
