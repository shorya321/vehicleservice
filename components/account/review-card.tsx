"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Star, MapPin, Car, Calendar, MoreVertical, Edit2, Trash2, Clock, CheckCircle } from "lucide-react"

interface ReviewCardProps {
  review: {
    id: string
    rating: number
    review_text: string | null
    status: string
    route_from: string | null
    route_to: string | null
    vehicle_class: string | null
    created_at: string
  }
  onEdit: () => void
  onDelete: () => void
}

export function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isPending = review.status === "pending"

  const handleMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = menuRef.current?.querySelectorAll<HTMLButtonElement>('button')
    if (!items?.length) return

    const currentIndex = Array.from(items).indexOf(document.activeElement as HTMLButtonElement)

    if (e.key === "ArrowDown") {
      e.preventDefault()
      items[Math.min(currentIndex + 1, items.length - 1)].focus()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      items[Math.max(currentIndex - 1, 0)].focus()
    } else if (e.key === "Escape") {
      e.preventDefault()
      setShowMenu(false)
      triggerRef.current?.focus()
    }
  }, [])

  useEffect(() => {
    if (showMenu && menuRef.current) {
      menuRef.current.querySelector<HTMLButtonElement>('button')?.focus()
    }
  }, [showMenu])
  const createdDate = new Date(review.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="account-item-card">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Rating & Content */}
        <div className="flex-1 min-w-0">
          {/* Rating & Status */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${star <= review.rating ? "text-[var(--gold)] fill-[var(--gold)]" : "text-[var(--graphite)]"}`}
                />
              ))}
            </div>
            <span className={`
              px-2 py-0.5 text-xs font-medium rounded-sm border flex items-center gap-1 uppercase
              ${isPending
                ? "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)] border-[var(--status-pending-border)]"
                : "bg-[var(--status-completed-bg)] text-[var(--status-completed-text)] border-[var(--status-completed-border)]"}
            `}>
              {isPending ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
              {review.status}
            </span>
          </div>

          {/* Review Text */}
          {review.review_text && (
            <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-3">
              {review.review_text}
            </p>
          )}

          {/* Route Info */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
            {(review.route_from || review.route_to) && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate max-w-[200px]">
                  {review.route_from && review.route_to
                    ? `${review.route_from} → ${review.route_to}`
                    : review.route_from || review.route_to}
                </span>
              </div>
            )}
            {review.vehicle_class && (
              <div className="flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" />
                <span>{review.vehicle_class}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{createdDate}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions (only for pending reviews) */}
        {isPending && (
          <div className="relative">
            <button
              ref={triggerRef}
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-[var(--charcoal)] rounded-lg transition-colors"
              aria-label="Review options"
              aria-expanded={showMenu}
              aria-haspopup="true"
              aria-controls={showMenu ? `review-menu-${review.id}` : undefined}
            >
              <MoreVertical className="w-4 h-4 text-[var(--text-muted)]" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div
                  ref={menuRef}
                  id={`review-menu-${review.id}`}
                  role="menu"
                  onKeyDown={handleMenuKeyDown}
                  className="absolute right-0 top-full mt-1 z-20 w-36 py-1 bg-[var(--charcoal)] border border-[var(--border-default)] rounded-lg shadow-xl"
                >
                  <button
                    role="menuitem"
                    onClick={() => { setShowMenu(false); onEdit() }}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--gold)]/10 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { setShowMenu(false); onDelete() }}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--error-text)] hover:bg-[var(--status-cancelled-bg)] flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
