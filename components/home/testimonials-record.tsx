import * as React from "react"
import { ArrowRight, Star } from "lucide-react"
import type { HomeReviewCard } from "@/lib/reviews/home-record"
import { CmsLink } from "@/components/cms/cms-link"
import type { HomeContent } from "@/lib/cms/templates/home/schema"

// `import * as React` is for jest: ts-jest compiles JSX with the classic
// runtime, which needs React in scope. Next itself uses the automatic runtime.

export interface TestimonialsRecordProps {
  cards: readonly HomeReviewCard[]
  content: HomeContent["testimonials"]
}

function ReviewCard({ card }: { card: HomeReviewCard }) {
  return (
    <figure className="record-card">
      <div className="record-card__top">
        <p className="record-card__rating numeric">
          <Star className="record-star record-star--lit" aria-hidden="true" />
          {card.rating} / 5
          <span className="sr-only"> stars</span>
        </p>
      </div>
      <blockquote className="record-card__quote">&quot;{card.text}&quot;</blockquote>
      <span className="record-card__rule" aria-hidden="true" />
      <figcaption className="record-card__by">
        <span className="record-card__avatar" aria-hidden="true">
          {card.initials || <Star className="record-card__avatar-icon" />}
        </span>
        <span className="record-card__who">
          <span className="record-card__name">{card.name}</span>
          {card.meta && <span className="record-card__meta numeric">{card.meta}</span>}
        </span>
      </figcaption>
    </figure>
  )
}

/**
 * Markup only, so it renders under test. Data loading lives in
 * ./testimonials.tsx. Every quote comes from the `reviews` table;
 * the home page hides this section entirely while there are none.
 */
export function TestimonialsRecord({ cards, content }: TestimonialsRecordProps) {
  return (
    <>
      <div className="record-head">
        <header className="max-w-2xl">
          <div className="editorial-eyebrow editorial-eyebrow--pill">
            <i aria-hidden="true" />
            {content.eyebrow}
          </div>
          <h2 id="testimonials-heading" className="editorial-section-title mt-5">
            {content.title}
          </h2>
          {content.body && <p className="editorial-body mt-6">{content.body}</p>}
        </header>
      </div>
      {cards.length > 0 && (
        <div className="record-cards">
          {cards.map((card) => (
            <ReviewCard key={card.id} card={card} />
          ))}
        </div>
      )}
      <div className="record-cta mt-10">
        <CmsLink href={content.cta.href} className="btn btn-secondary">
          {content.cta.label}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </CmsLink>
      </div>
    </>
  )
}
