import type { LucideIcon } from "lucide-react";

/** Themed "coming soon" page for nav items not built yet. */
export function Placeholder({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <span className="border-line bg-surface text-ink-2 grid h-12 w-12 place-items-center rounded-xl border">
        <Icon className="h-5 w-5" />
      </span>
      <h1 className="text-ink mt-5 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-ink-2 mt-2 max-w-sm text-sm">{description}</p>
      <span className="border-line text-ink-3 mt-5 rounded-full border px-3 py-1 text-xs font-medium">
        Coming soon
      </span>
    </div>
  );
}
