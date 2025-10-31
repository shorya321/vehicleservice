'use client'

import { useState } from 'react'
import { ReviewsTable } from './reviews-table'
import { BulkActionsBar } from './bulk-actions-bar'

interface Review {
  id: string
  rating: number
  review_text: string | null
  created_at: string
  route_from: string | null
  route_to: string | null
  vehicle_class: string | null
  admin_response: string | null
  admin_response_at: string | null
  status: 'pending' | 'approved' | 'rejected'
  is_featured: boolean
  customer: {
    full_name: string | null
    avatar_url: string | null
    email: string
  }
}

interface ReviewsTableWrapperProps {
  reviews: Review[]
}

export function ReviewsTableWrapper({ reviews }: ReviewsTableWrapperProps) {
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set())

  const handleSelectionChange = (selected: Set<string>) => {
    setSelectedReviews(selected)
  }

  const handleClearSelection = () => {
    setSelectedReviews(new Set())
  }

  return (
    <div className="space-y-4">
      {selectedReviews.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedReviews.size}
          selectedReviewIds={Array.from(selectedReviews)}
          onClearSelection={handleClearSelection}
        />
      )}
      <ReviewsTable
        reviews={reviews}
        selectedReviews={selectedReviews}
        onSelectionChange={handleSelectionChange}
      />
    </div>
  )
}
