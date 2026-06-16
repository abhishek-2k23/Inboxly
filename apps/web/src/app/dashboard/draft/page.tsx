import { FileText } from "lucide-react";
import { Placeholder } from "@/components/dashboard/Placeholder";

export default function DraftPage() {
  return (
    <Placeholder
      icon={FileText}
      title="Drafts"
      description="Replies and messages in progress, ready for a final review before they go out."
    />
  );
}
