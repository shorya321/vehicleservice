import { Star, Quote, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatedCard } from "@/components/ui/animated-card"
import Link from "next/link"
import { getFeaturedReviews, getReviewStats } from "@/app/reviews/actions"
import { format, formatDistanceToNow } from "date-fns"

const ReviewStars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-luxury-gold fill-luxury-gold" : "text-luxury-lightGray/30"}`}
        aria-hidden="true"
      />
    ))}
  </div>
)

export async function Testimonials() {
  // Get featured reviews from database
  const { data: reviews } = await getFeaturedReviews()
  const { data: stats } = await getReviewStats()

  // Fallback to static data if no reviews
  const displayReviews = reviews && reviews.length > 0 ? reviews.slice(0, 6) : []

  return (
    <div className="section-padding bg-luxury-darkGray">
      <div className="luxury-container">
        <div className="section-title-wrapper">
          <h2 className="section-title">What Our Customers Say</h2>
          <div className="section-divider"></div>
          {stats && stats.totalReviews > 0 && (
            <div className="flex justify-center items-center space-x-2 mb-2" role="img" aria-label={`Average rating ${stats.averageRating.toFixed(1)} stars from ${stats.totalReviews.toLocaleString()} reviews`}>
              <Star className="w-7 h-7 text-luxury-gold fill-luxury-gold" aria-hidden="true" />
              <span className="text-3xl font-serif text-luxury-pearl">{stats.averageRating.toFixed(1)}</span>
              <span className="text-luxury-lightGray">from {stats.totalReviews.toLocaleString()}+ reviews</span>
            </div>
          )}
          <p className="section-subtitle">
            Real experiences from our valued customers. Discover why travelers choose Infinia Transfers!
          </p>
        </div>

        {displayReviews.length === 0 ? (
          <div className="text-center text-luxury-lightGray py-12">
            <p>Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayReviews.map((review, index) => {
              const customerName = review.customer?.full_name || review.customer?.email?.split('@')[0] || 'Customer'

              return (
                <AnimatedCard
                  key={review.id}
                  delay={index * 0.1}
                  className="luxury-card luxury-card-hover flex flex-col p-6 h-full"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-serif text-lg text-luxury-pearl">{customerName}</h4>
                        <CheckCircle className="w-4 h-4 text-luxury-gold" title="Verified Customer" />
                      </div>
                      {review.route_from && review.route_to && (
                        <p className="text-xs text-luxury-lightGray/80">
                          {review.route_from} → {review.route_to}
                        </p>
                      )}
                    </div>
                    <ReviewStars rating={review.rating} />
                  </div>
                  <p className="text-xs text-luxury-lightGray/70 mb-4">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </p>
                  <Quote className="w-6 h-6 text-luxury-gold/30 mb-2 self-start" aria-hidden="true" />
                  <p className="text-sm text-luxury-lightGray italic mb-5 flex-grow line-clamp-4">
                    "{review.review_text || 'Excellent service!'}"
                  </p>
                  <Link href="/reviews">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="self-start p-0 h-auto text-luxury-gold hover:text-luxury-goldLight"
                    >
                      READ MORE
                    </Button>
                  </Link>
                </AnimatedCard>
              )
            })}
          </div>
        )}

        {/* View All Reviews CTA */}
        <div className="text-center mt-12">
          <Link href="/reviews">
            <Button className="bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black px-8 py-3">
              View All Reviews
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
