import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { avatarColor, initials } from "@/lib/ui";
import { REVIEWS } from "@/utils/landing-data";

export function Reviews() {
  return (
    <section id="reviews" className="scroll-mt-20 py-20 sm:py-28">
      <Container>
        <SectionHeading eyebrow="Reviews" title="Loved by people who spend their day in email" />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {REVIEWS.map((review, i) => (
            <Reveal key={review.name} delay={i * 90}>
              <figure className="bg-panel hairline flex h-full flex-col rounded-2xl p-6">
                <blockquote className="text-ink flex-1 text-pretty text-sm leading-relaxed">
                  “{review.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: avatarColor(review.seed) }}
                  >
                    {initials(review.name)}
                  </span>
                  <span>
                    <span className="text-ink block text-sm font-medium">{review.name}</span>
                    <span className="text-ink-3 block text-xs">{review.role}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
