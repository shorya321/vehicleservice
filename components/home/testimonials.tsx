import { getApprovedReviews, getFeaturedReviews, getReviewStats } from "@/app/reviews/actions"
import { buildHomeCards, HOME_CARD_LIMIT, pickHomeReviews, type HomeReview } from "@/lib/reviews/home-record"
import { applyDevPreview } from "@/lib/reviews/dev-sample-preview"
import { loadReviewerNames } from "@/lib/reviews/reviewer-names"
import { isAdminEntered } from "@/lib/reviews/sources"
import { TestimonialsAnimator } from "./testimonials-animator"
import { TestimonialsRecord } from "./testimonials-record"
import type { HomeContent } from "@/lib/cms/templates/home/schema"

// Fills the grid when admin has featured fewer than three reviews, from the
// same approved reviews /reviews already lists.
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

export async function Testimonials({ content }: { content: HomeContent["testimonials"] }) {
  // Every loader logs and returns a safe empty value on failure, so an outage
  // renders fewer cards rather than breaking the home page.
  const [featuredResult, statsResult] = await Promise.all([getFeaturedReviews(), getReviewStats()])
  const featured: HomeReview[] = featuredResult.data ?? []
  const fromFeatured = pickHomeReviews(featured, [])
  const realReviews =
    fromFeatured.length >= HOME_CARD_LIMIT ? fromFeatured : pickHomeReviews(featured, await loadFallbackReviews())

  // Sample copy fills the grid on the local dev server only, while the
  // database is empty. Production builds always get real reviews.
  const { reviews, stats } = applyDevPreview({ reviews: realReviews, stats: statsResult.data }, process.env.NODE_ENV)

  const names = await loadReviewerNames(
    reviews
      .filter((review) => !isAdminEntered(review.source))
      .map((review) => review.customer_id)
      .filter((id): id is string => Boolean(id))
  )

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="editorial-section editorial-section--raised"
    >
      <TestimonialsAnimator>
        <div className="luxury-container">
          <TestimonialsRecord cards={buildHomeCards(reviews, names)} stats={stats} content={content} />
        </div>
      </TestimonialsAnimator>
    </section>
  )
}
