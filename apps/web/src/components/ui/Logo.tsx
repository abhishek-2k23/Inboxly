import Link from "next/link";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/ui";

/** Inboxly wordmark with a square inbox glyph. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2", className)}>
      <span className="bg-accent text-accent-ink grid h-7 w-7 place-items-center rounded-[7px]">
        <Inbox className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <span className="text-ink text-[1.05rem] font-semibold tracking-tight">Inboxly</span>
    </Link>
  );
}
