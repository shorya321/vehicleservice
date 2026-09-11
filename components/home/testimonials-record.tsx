import * as React from "react"
import Link from "next/link"
import { ArrowRight, Star } from "lucide-react"
import {
  formatAverage,
  hasRatings,
  quoteText,
  type HomeReview,
  type RatingRow,
  type ReviewStatsSummary,
} from "@/lib/reviews/home-record"

// `import * as React` is for jest: ts-jest compiles JSX with the classic
// runtime, which needs React in scope. Next itself uses the automatic runtime.

const STAR_COUNT = 5

export interface TestimonialsRecordProps {
  quote: HomeReview | null
  attribution: string | null
  stats: ReviewStatsSummary
  rows: readonly RatingRow[]
}

function RecordStars({ filled }: { filled: number }) {
  return (
    <div className="record-stars" aria-hidden="true">
      {Array.from({ length: STAR_COUNT }, (_, i) => (
        <Star key={i} className={i < filled ? "record-star record-star--lit" : "record-star"} />
      ))}
    </div>
  )
}

function ScoreCard({ stats, rows }: Pick<TestimonialsRecordProps, "stats" | "rows">) {
  const rated = hasRatings(stats)
  const average = formatAverage(stats.averageRating)
  const total = stats.totalReviews.toLocaleString("en-US")

  return (
    <div className="record-score">
      {rated ? (
        <>
          <p className="record-score__avg numeric">
            {average}
            <span className="sr-only"> out of 5</span>
          </p>
          <RecordStars filled={Math.round(Number(stats.averageRating))} />
          <p className="record-score__of numeric">
            from {total} {stats.totalReviews === 1 ? "review" : "reviews"}
          </p>
        </>
      ) : (
        <>
          <p className="record-score__empty">No ratings yet</p>
          <RecordStars filled={0} />
          <p className="record-score__of">Ratings appear here as travellers leave them.</p>
        </>
      )}
      <ul className="record-bars" aria-label="Rating distribution">
        {rows.map((row) => (
          <li key={row.stars} className="record-bar">
            <span className="numeric">{row.stars} star</span>
            <span className="record-bar__track" aria-hidden="true">
              <span className="record-bar__fill" style={{ width: `${row.percent}%` }} />
            </span>
            <span className="numeric">{row.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function QuoteColumn({ quote, attribution }: Pick<TestimonialsRecordProps, "quote" | "attribution">) {
  return (
    <div>
      {quote ? (
        <figure className="m-0">
          <blockquote className="record-quote">&quot;{quoteText(quote)}&quot;</blockquote>
          {attribution && <figcaption className="record-attr numeric">{attribution}</figcaption>}
        </figure>
      ) : (
        <div>
          <p className="record-quote record-quote--empty">Awaiting first entry.</p>
          <p className="editorial-body mt-4">Be the first to share your experience.</p>
        </div>
      )}
      <div className="mt-8">
        <Link href="/reviews" className="btn btn-secondary">
          Read every review
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

/**
 * Markup only, so both states render under test. Data loading lives in
 * ./testimonials.tsx. Every figure is from the `reviews` table; the empty
 * record is shown as empty rather than filled with sample copy.
 */
export function TestimonialsRecord({ quote, attribution, stats, rows }: TestimonialsRecordProps) {
  return (
    <>
      <header className="max-w-2xl">
        <div className="editorial-eyebrow">Spoken for</div>
        <h2 id="testimonials-heading" className="editorial-section-title mt-5">
          Travellers on record.
        </h2>
      </header>
      <div className="record-grid">
        <ScoreCard stats={stats} rows={rows} />
        <QuoteColumn quote={quote} attribution={attribution} />
      </div>
    </>
  )
}
