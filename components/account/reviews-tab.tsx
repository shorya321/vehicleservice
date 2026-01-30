"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Star, MessageSquare, Clock, CheckCircle, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { getMyReviews, getReviewStats, getEligibleBookings, deleteReview, type ReviewFilters } from "@/app/account/review-actions"
import { ReviewCard } from "./review-card"
import { ReviewFormModal } from "./review-form-modal"
import { toast } from "sonner"

interface ReviewsTabProps {
  userId: string
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
]

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
]

const RATING_OPTIONS = [
  { value: "all", label: "All Ratings" },
  { value: "5", label: "5 Stars" },
  { value: "4-5", label: "4-5 Stars" },
  { value: "1-3", label: "1-3 Stars" },
]

export function ReviewsTab({ userId }: ReviewsTabProps) {
  const [reviews, setReviews] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, averageRating: 0 })
  const [eligibleBookings, setEligibleBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingReview, setEditingReview] = useState<any>(null)
  const [filters, setFilters] = useState<ReviewFilters>({
    search: "",
    sortBy: "newest",
    status: "all",
    ratingRange: "all",
    page: 1,
    limit: 20,
  })
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, page: 1 })

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    const [reviewsResult, statsResult, eligibleResult] = await Promise.all([
      getMyReviews(filters),
      getReviewStats(),
      getEligibleBookings(),
    ])
    setReviews(reviewsResult.data || [])
    setPagination({
      total: reviewsResult.total,
      totalPages: reviewsResult.totalPages,
      page: reviewsResult.page || 1,
    })
    if (statsResult.data) setStats(statsResult.data)
    if (eligibleResult.data) setEligibleBookings(eligibleResult.data)
    setIsLoading(false)
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFilterChange = (key: keyof ReviewFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  }

  const handleDelete = async (reviewId: string) => {
    const result = await deleteReview(reviewId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Review deleted")
      fetchData()
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Total" value={stats.total} color="gold" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Pending" value={stats.pending} color="yellow" />
        <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Approved" value={stats.approved} color="green" />
        <StatCard icon={<Star className="w-5 h-5" />} label="Avg Rating" value={stats.averageRating.toFixed(1)} color="gold" />
      </div>

      {/* Eligible Bookings CTA */}
      {eligibleBookings.length > 0 && (
        <div className="luxury-card p-4 border-[var(--gold)]/30 bg-[var(--gold)]/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-[var(--gold)]">
                {eligibleBookings.length} completed booking{eligibleBookings.length > 1 ? "s" : ""} awaiting review
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">Share your experience and help others</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Write Review
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="luxury-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="luxury-input pl-11"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="luxury-input min-w-[130px]"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="luxury-input min-w-[120px]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={filters.ratingRange}
              onChange={(e) => handleFilterChange("ratingRange", e.target.value)}
              className="luxury-input min-w-[120px]"
            >
              {RATING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="luxury-card p-12 text-center">
            <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[var(--text-muted)]">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="luxury-card p-12 text-center">
            <MessageSquare className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No reviews found</h3>
            <p className="text-sm text-[var(--text-muted)]">
              {filters.search || filters.status !== "all" || filters.ratingRange !== "all"
                ? "Try adjusting your filters"
                : "Complete a booking to write your first review"}
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onEdit={() => setEditingReview(review)}
              onDelete={() => handleDelete(review.id)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters((p) => ({ ...p, page: p.page! - 1 }))}
              disabled={pagination.page === 1}
              className="btn btn-secondary disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setFilters((p) => ({ ...p, page: p.page! + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="btn btn-secondary disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <ReviewFormModal
          eligibleBookings={eligibleBookings}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); fetchData() }}
        />
      )}
      {editingReview && (
        <ReviewFormModal
          review={editingReview}
          onClose={() => setEditingReview(null)}
          onSuccess={() => { setEditingReview(null); fetchData() }}
        />
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  const iconColorClasses: Record<string, string> = {
    gold: "text-[var(--gold)]",
    yellow: "text-yellow-400",
    green: "text-green-400",
  }
  return (
    <div className="luxury-card p-4">
      <div className="flex items-center gap-3">
        <div className="profile-stat">
          <div className={`profile-stat-icon ${color}`}>
            <span className={iconColorClasses[color]}>{icon}</span>
          </div>
        </div>
        <div>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">{value}</p>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </div>
  )
}
