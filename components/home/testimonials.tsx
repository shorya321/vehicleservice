import { Star, ArrowRight } from "lucide-react"
import Link from "next/link"
import { getFeaturedReviews, getReviewStats } from "@/app/reviews/actions"
import { TestimonialsAnimator } from "./testimonials-animator"

const ReviewStars = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) => {
  const starSize = size === "lg" ? "w-5 h-5" : "w-4 h-4"
  return (
    <div className="flex items-center gap-1" role="img" aria-label={`${rating} out of 5 stars`}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${starSize} ${i < rating ? "text-[var(--gold)] fill-[var(--gold)]" : "text-[var(--text-muted)]/30"}`}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export { ReviewStars }

interface ReviewLike {
  id?: string | number
  comment?: string | null
  content?: string | null
  rating?: number | null
  customer_name?: string | null
  customerName?: string | null
  name?: string | null
  location?: string | null
  city?: string | null
  route?: string | null
}

function pickQuote(review: ReviewLike): string {
  return (review.comment || review.content || "").trim()
}

function pickAttribution(review: ReviewLike): string {
  const name = review.customer_name || review.customerName || review.name || "Anonymous"
  const place = review.location || review.city || review.route
  return place ? `${name} — ${place}` : name
}

export async function Testimonials() {
  const { data: reviews } = await getFeaturedReviews()
  const { data: stats } = await getReviewStats()

  const visible = (reviews ?? []).slice(0, 2).filter((r) => pickQuote(r).length > 0)
  const hasReviews = visible.length > 0

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="editorial-section editorial-section--raised editorial-section--spacious"
    >
      <TestimonialsAnimator>
        <div className="mx-auto max-w-3xl px-[var(--space-xl)] sm:px-[var(--space-2xl)] text-center">
          <header>
            <div className="editorial-eyebrow justify-center">Spoken for</div>
            <h2 id="testimonials-heading" className="editorial-section-title--promoted mt-5">
              What travellers say, in their own words.
            </h2>
            {stats && stats.totalReviews > 0 && (
              <p
                className="mt-6 flex items-center justify-center gap-3 text-[var(--text-secondary)]"
                role="img"
                aria-label={`Average rating ${stats.averageRating.toFixed(1)} stars from ${stats.totalReviews.toLocaleString()} reviews`}
              >
                <Star className="w-4 h-4 text-[var(--gold)] fill-[var(--gold)]" aria-hidden="true" />
                <span className="numeric text-lg text-[var(--text-primary)]">
                  {stats.averageRating.toFixed(1)}
                </span>
                <span className="text-[0.6875rem] tracking-[0.16em] uppercase text-[var(--text-muted)]">
                  from {stats.totalReviews.toLocaleString()} reviews
                </span>
              </p>
            )}
          </header>

          {hasReviews ? (
            <div className="mt-14">
              <figure className="rounded-2xl bg-[rgba(var(--gold-rgb),0.03)] border-t border-[var(--graphite)] px-8 pt-8 pb-10">
                <blockquote className="pullquote mx-auto">
                  &ldquo;{pickQuote(visible[0])}&rdquo;
                </blockquote>
                <figcaption className="pullquote-attribution">
                  {pickAttribution(visible[0])}
                </figcaption>
              </figure>
            </div>
          ) : (
            <p className="mt-12 text-[var(--text-muted)]">Be the first to share your experience.</p>
          )}

          <div className="mt-12 flex justify-center">
            <Link href="/reviews" className="editorial-action">
              Read every review
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </TestimonialsAnimator>
    </section>
  )
}
