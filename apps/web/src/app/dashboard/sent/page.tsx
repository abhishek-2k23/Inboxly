import { Send } from "lucide-react";
import { Placeholder } from "@/components/dashboard/Placeholder";

export default function SentPage() {
  return (
    <Placeholder
      icon={Send}
      title="Sent"
      description="Everything you've sent, including replies the agent drafted for you."
    />
  );
}
