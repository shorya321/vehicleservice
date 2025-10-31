'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  MoreHorizontal,
  Star,
  MapPin,
  Trash2,
  Edit,
  Eye,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { deleteReview } from '../actions'
import { EmptyState } from '@/components/ui/empty-state'

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

interface CustomerReviewsTableProps {
  reviews: Review[]
  onSelectionChange?: (selected: Set<string>) => void
}

export function CustomerReviewsTable({ reviews, onSelectionChange }: CustomerReviewsTableProps) {
  const router = useRouter()
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set())
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      approved: 'secondary',
      rejected: 'destructive',
    }

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const handleSelectAll = (checked: boolean) => {
    // Only select pending reviews
    const pendingReviews = reviews.filter(r => r.status === 'pending')
    const newSelected = checked ? new Set(pendingReviews.map(review => review.id)) : new Set()
    setSelectedReviews(newSelected)
    onSelectionChange?.(newSelected)
  }

  const handleSelectOne = (reviewId: string, checked: boolean) => {
    const newSelected = new Set(selectedReviews)
    if (checked) {
      newSelected.add(reviewId)
    } else {
      newSelected.delete(reviewId)
    }
    setSelectedReviews(newSelected)
    onSelectionChange?.(newSelected)
  }

  const isSelected = (reviewId: string) => selectedReviews.has(reviewId)
  const pendingReviews = reviews.filter(r => r.status === 'pending')
  const isAllSelected = pendingReviews.length > 0 && selectedReviews.size === pendingReviews.length
  const isIndeterminate = selectedReviews.size > 0 && !isAllSelected

  const handleDelete = async () => {
    if (!deleteReviewId) return

    setIsDeleting(true)
    try {
      const result = await deleteReview(deleteReviewId)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Review deleted successfully')
        router.refresh()
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
      setDeleteReviewId(null)
    }
  }

  const truncateText = (text: string | null, maxLength: number = 100) => {
    if (!text) return '-'
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-luxury-gold text-luxury-gold'
                : 'fill-none text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="No reviews yet"
        description="You haven't submitted any reviews. Complete a booking to leave your first review!"
      />
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all pending reviews"
                  className={isIndeterminate ? 'data-[state=indeterminate]:bg-primary' : ''}
                />
              </TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="min-w-[200px]">Review</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => {
              const isPending = review.status === 'pending'

              return (
                <TableRow
                  key={review.id}
                  className="hover:bg-muted/50"
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected(review.id)}
                      onCheckedChange={(checked) => handleSelectOne(review.id, checked as boolean)}
                      disabled={!isPending}
                      aria-label={`Select review`}
                    />
                  </TableCell>
                  <TableCell>{renderStars(review.rating)}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm text-muted-foreground">
                        {truncateText(review.review_text)}
                      </p>
                      {review.admin_response && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-luxury-gold">
                          <Star className="h-3 w-3 fill-luxury-gold" />
                          Admin responded
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {review.route_from && review.route_to ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="max-w-[150px] truncate">
                          {review.route_from} → {review.route_to}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(review.status)}
                      {review.is_featured && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="h-3 w-3 mr-1 fill-luxury-gold text-luxury-gold" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(review.created_at), 'MMM d, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => router.push(`/customer/reviews/${review.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>

                        {isPending && (
                          <>
                            <DropdownMenuItem
                              onClick={() => router.push(`/customer/reviews/${review.id}/edit`)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Review
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => setDeleteReviewId(review.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteReviewId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteReviewId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? 'Deleting...' : 'Delete Review'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
