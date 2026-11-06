import * as React from "react"
import { ArrowRight, Star } from "lucide-react"
import {
  formatAverage,
  hasRatings,
  type HomeReviewCard,
  type ReviewStatsSummary,
} from "@/lib/reviews/home-record"
import { CmsLink } from "@/components/cms/cms-link"
import type { HomeContent } from "@/lib/cms/templates/home/schema"

// `import * as React` is for jest: ts-jest compiles JSX with the classic
// runtime, which needs React in scope. Next itself uses the automatic runtime.

const STAR_COUNT = 5

export interface TestimonialsRecordProps {
  cards: readonly HomeReviewCard[]
  stats: ReviewStatsSummary
  content: HomeContent["testimonials"]
}

function ScoreBox({ stats }: { stats: ReviewStatsSummary }) {
  if (!hasRatings(stats)) return null
  const average = formatAverage(stats.averageRating)
  const total = stats.totalReviews.toLocaleString("en-US")
  const lit = Math.round(Number(stats.averageRating))

  return (
    <div className="record-score">
      <p className="record-score__avg numeric">
        {average}
        <span className="sr-only"> out of 5</span>
      </p>
      <div>
        <div className="record-stars" aria-hidden="true">
          {Array.from({ length: STAR_COUNT }, (_, i) => (
            <Star key={i} className={i < lit ? "record-star record-star--lit" : "record-star"} />
          ))}
        </div>
        <p className="record-score__of numeric">
          Average from {total} {stats.totalReviews === 1 ? "review" : "reviews"}
        </p>
      </div>
    </div>
  )
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
        <span className="record-card__source">{card.sourceLabel}</span>
      </div>
      <blockquote className="record-card__quote">&quot;{card.text}&quot;</blockquote>
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
 * ./testimonials.tsx. Every figure and quote comes from the `reviews` table;
 * the home page hides this section entirely while there are none.
 */
export function TestimonialsRecord({ cards, stats, content }: TestimonialsRecordProps) {
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
        <ScoreBox stats={stats} />
      </div>
      {cards.length > 0 && (
        <div className="record-cards">
          {cards.map((card) => (
            <ReviewCard key={card.id} card={card} />
          ))}
        </div>
      )}
      <div className="mt-10">
        <CmsLink href={content.cta.href} className="btn btn-secondary">
          {content.cta.label}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </CmsLink>
      </div>
    </>
  )
}
