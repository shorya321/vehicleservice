import { Star, ArrowRight } from "lucide-react"
import Link from "next/link"
import { getFeaturedReviews, getReviewStats } from "@/app/reviews/actions"
import { TestimonialCarousel } from "./testimonial-carousel"

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

export async function Testimonials() {
  // Get featured reviews from database
  const { data: reviews } = await getFeaturedReviews()
  const { data: stats } = await getReviewStats()

  const hasReviews = reviews && reviews.length > 0

  return (
    <section className="section-padding testimonials-section">

      <div className="luxury-container relative z-10">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-eyebrow">Testimonials</span>
          <h2 className="section-title">What Our Customers Say</h2>
          <div className="section-divider">
            <div className="section-divider-icon"></div>
          </div>
          {stats && stats.totalReviews > 0 && (
            <div className="flex justify-center items-center gap-3 mb-4" role="img" aria-label={`Average rating ${stats.averageRating.toFixed(1)} stars from ${stats.totalReviews.toLocaleString()} reviews`}>
              <Star className="w-6 h-6 text-[var(--gold)] fill-[var(--gold)]" aria-hidden="true" />
              <span className="text-3xl font-display text-[var(--text-primary)]">{stats.averageRating.toFixed(1)}</span>
              <span className="text-[var(--text-muted)]">from {stats.totalReviews.toLocaleString()}+ reviews</span>
            </div>
          )}
          <p className="section-subtitle">
            Real experiences from our valued customers. Discover why travelers choose Infinia Transfers!
          </p>
        </div>

        {hasReviews ? (
          <>
            <TestimonialCarousel reviews={reviews} />

            {/* View All Reviews Button - Centered Below */}
            <div className="text-center mt-12">
              <Link href="/reviews" className="btn btn-secondary">
                View All Reviews
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center text-[var(--text-muted)] py-12">
            <p>Be the first to share your experience!</p>
          </div>
        )}
      </div>
    </section>
  )
}
