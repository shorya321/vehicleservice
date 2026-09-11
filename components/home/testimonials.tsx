import { getApprovedReviews, getFeaturedReviews, getReviewStats } from "@/app/reviews/actions"
import {
  buildRatingRows,
  formatQuoteAttribution,
  pickHomeQuote,
  type HomeReview,
} from "@/lib/reviews/home-record"
import { TestimonialsAnimator } from "./testimonials-animator"
import { TestimonialsRecord } from "./testimonials-record"

// Fallback when admin has approved reviews but featured none, so the home
// section fills from the same reviews /reviews already lists.
const FALLBACK_MIN_RATING = 4
const FALLBACK_LIMIT = 6

async function loadFallbackReviews(): Promise<HomeReview[]> {
  const { data } = await getApprovedReviews({
    rating: FALLBACK_MIN_RATING,
    sortBy: "newest",
    page: 1,
    limit: FALLBACK_LIMIT,
  })
  return data ?? []
}

export async function Testimonials() {
  // Both actions log and return a safe empty value on failure, so an outage
  // renders the empty record rather than breaking the home page.
  const [featuredResult, statsResult] = await Promise.all([getFeaturedReviews(), getReviewStats()])
  const featured: HomeReview[] = featuredResult.data ?? []
  const quote =
    pickHomeQuote(featured, []) ?? pickHomeQuote([], await loadFallbackReviews())
  const stats = statsResult.data

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="editorial-section editorial-section--raised"
    >
      <TestimonialsAnimator>
        <div className="luxury-container">
          <TestimonialsRecord
            quote={quote}
            attribution={quote ? formatQuoteAttribution(quote) : null}
            stats={stats}
            rows={buildRatingRows(stats)}
          />
        </div>
      </TestimonialsAnimator>
    </section>
  )
}
