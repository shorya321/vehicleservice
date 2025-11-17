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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Star,
  MapPin,
  MessageSquare,
  Trash2,
  StarIcon,
  Loader2,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { approveReview, rejectReview, toggleFeaturedReview, deleteReview } from '../actions'
import { EmptyState } from '@/components/ui/empty-state'
import { AdminReplyModal } from './admin-reply-modal'

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

interface ReviewsTableProps {
  reviews: Review[]
  selectedReviews: Set<string>
  onSelectionChange?: (selected: Set<string>) => void
}

export function ReviewsTable({ reviews, selectedReviews, onSelectionChange }: ReviewsTableProps) {
  const router = useRouter()
  const [actionReviewId, setActionReviewId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'delete' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [replyModalReviewId, setReplyModalReviewId] = useState<string | null>(null)

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
    const newSelected = checked ? new Set(reviews.map(review => review.id)) : new Set()
    onSelectionChange?.(newSelected)
  }

  const handleSelectOne = (reviewId: string, checked: boolean) => {
    const newSelected = new Set(selectedReviews)
    if (checked) {
      newSelected.add(reviewId)
    } else {
      newSelected.delete(reviewId)
    }
    onSelectionChange?.(newSelected)
  }

  const isSelected = (reviewId: string) => selectedReviews.has(reviewId)
  const isAllSelected = reviews.length > 0 && selectedReviews.size === reviews.length
  const isIndeterminate = selectedReviews.size > 0 && !isAllSelected

  const handleAction = async () => {
    if (!actionReviewId || !actionType) return

    setIsProcessing(true)
    try {
      let result
      switch (actionType) {
        case 'approve':
          result = await approveReview(actionReviewId)
          break
        case 'reject':
          result = await rejectReview(actionReviewId)
          break
        case 'delete':
          result = await deleteReview(actionReviewId)
          break
      }

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Review ${actionType}d successfully`)
        router.refresh()
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsProcessing(false)
      setActionReviewId(null)
      setActionType(null)
    }
  }

  const handleToggleFeatured = async (reviewId: string, currentFeatured: boolean) => {
    try {
      const result = await toggleFeaturedReview(reviewId, !currentFeatured)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(currentFeatured ? 'Removed from featured' : 'Featured successfully')
        router.refresh()
      }
    } catch (error) {
      toast.error('Failed to toggle featured status')
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
        title="No reviews found"
        description="Try adjusting your filters to see more results"
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
                  aria-label="Select all reviews"
                  className={isIndeterminate ? 'data-[state=indeterminate]:bg-primary' : ''}
                />
              </TableHead>
              <TableHead>Customer</TableHead>
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
              const customerName = review.customer.full_name || review.customer.email.split('@')[0]
              const initials = customerName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)

              return (
                <TableRow
                  key={review.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected(review.id)}
                      onCheckedChange={(checked) => handleSelectOne(review.id, checked as boolean)}
                      aria-label={`Select review from ${customerName}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.customer.avatar_url || undefined} />
                        <AvatarFallback>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{customerName}</span>
                        <span className="text-xs text-muted-foreground">{review.customer.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{renderStars(review.rating)}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm text-muted-foreground">
                        {truncateText(review.review_text)}
                      </p>
                      {review.admin_response && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-luxury-gold">
                          <MessageSquare className="h-3 w-3" />
                          Admin replied
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
                          onClick={() => router.push(`/admin/reviews/${review.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>

                        {review.status === 'pending' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setActionReviewId(review.id)
                                setActionType('approve')
                              }}
                              className="text-emerald-500"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setActionReviewId(review.id)
                                setActionType('reject')
                              }}
                              className="text-red-500"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}

                        {!review.admin_response && (
                          <DropdownMenuItem
                            onClick={() => setReplyModalReviewId(review.id)}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Quick Reply
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => handleToggleFeatured(review.id, review.is_featured)}
                        >
                          <StarIcon className="mr-2 h-4 w-4" />
                          {review.is_featured ? 'Unfeature' : 'Feature'}
                        </DropdownMenuItem>

                        {review.status === 'pending' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setActionReviewId(review.id)
                                setActionType('delete')
                              }}
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

      {/* Confirmation Dialog */}
      <AlertDialog
        open={actionReviewId !== null && actionType !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActionReviewId(null)
            setActionType(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' && 'Approve Review'}
              {actionType === 'reject' && 'Reject Review'}
              {actionType === 'delete' && 'Delete Review'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve' && 'This review will be visible to all customers.'}
              {actionType === 'reject' && 'This review will not be visible to customers.'}
              {actionType === 'delete' && 'This action cannot be undone. The review will be permanently deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={isProcessing}
              className={actionType === 'delete' || actionType === 'reject' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isProcessing ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reply Modal */}
      {replyModalReviewId && (
        <AdminReplyModal
          reviewId={replyModalReviewId}
          onClose={() => setReplyModalReviewId(null)}
          onSuccess={() => {
            setReplyModalReviewId(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
