import { CalendarDays } from "lucide-react";
import { Placeholder } from "@/components/dashboard/Placeholder";

export default function CalendarPage() {
  return (
    <Placeholder
      icon={CalendarDays}
      title="Calendar"
      description="Your schedule at a glance, with events the agent creates appearing here."
    />
  );
}
