import { Avatar } from "@/components/ui";
import { SectionGlow } from "@/components/landing/section-glow";

const REVIEWS = [
  {
    name: "Sarah Chen",
    role: "Product Manager, Flux",
    quote:
      "Inboxly cut my morning email triage from 30 minutes to 5. The summaries are scary accurate.",
  },
  {
    name: "Marcus Webb",
    role: "Founder, Loop Studio",
    quote:
      "I schedule half my meetings by just typing a sentence now — it even adds the Meet link for me.",
  },
  {
    name: "Priya Nair",
    role: "Engineering Lead, Nimbus",
    quote:
      "Priority detection means I actually trust my inbox again. Nothing urgent gets buried anymore.",
  },
];

export function Reviews() {
  return (
    <section id="reviews" className="relative overflow-hidden px-6 py-16 sm:py-24">
      <SectionGlow variant="even" />
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-ink text-2xl font-medium tracking-tight sm:text-3xl">
          Loved by people who live in their inbox.
        </h2>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3">
        {REVIEWS.map((review) => (
          <div
            key={review.name}
            className="bg-panel hairline flex flex-col gap-4 rounded-[var(--radius-card)] p-6"
          >
            <p className="text-ink-2 text-sm leading-relaxed">&ldquo;{review.quote}&rdquo;</p>
            <div className="mt-auto flex items-center gap-3">
              <Avatar name={review.name} size={36} />
              <div className="min-w-0">
                <p className="text-ink truncate text-sm font-medium">{review.name}</p>
                <p className="text-ink-2 truncate text-xs">{review.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
