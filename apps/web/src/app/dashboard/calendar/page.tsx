import { CalendarView } from "@/components/calendar/CalendarView";
import { IntegrationGate } from "@/components/dashboard/ConnectPrompt";

export default function CalendarPage() {
  return (
    <IntegrationGate requires={["googlecalendar"]}>
      <CalendarView />
    </IntegrationGate>
  );
}
