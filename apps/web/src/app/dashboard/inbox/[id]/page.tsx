import { Suspense } from "react";
import { EmailDetailView } from "@/components/inbox/EmailDetailView";

export default async function EmailDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <EmailDetailView id={id} />
    </Suspense>
  );
}
