'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { StarRating } from './star-rating'
import { AdminResponseForm } from './admin-response-form'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { approveReview, rejectReview, toggleFeaturedReview } from '@/app/admin/reviews/actions'
import { deleteReview } from '@/app/customer/reviews/actions'

export interface Review {
  id: string
  rating: number
  review_text: string | null
  created_at: string
  route_from: string | null
  route_to: string | null
  vehicle_class: string | null
  admin_response: string | null
  admin_response_at: string | null
  photos: string[] | null
  status: 'pending' | 'approved' | 'rejected'
  is_featured: boolean
  customer: {
    full_name: string | null
    avatar_url: string | null
    email: string
  }
}

interface ReviewCardProps {
  review: Review
  variant?: 'featured' | 'compact' | 'admin'
  className?: string
}

export function ReviewCard({
  review,
  variant = 'featured',
  className,
}: ReviewCardProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false)
  const [showResponseForm, setShowResponseForm] = useState(false)

  // Loading states
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isTogglingFeature, setIsTogglingFeature] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Dialog states
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Internal action handlers
  const handleApprove = async () => {
    setIsApproving(true)

    try {
      const result = await approveReview(review.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Review approved successfully')
      setShowApproveDialog(false)
      router.refresh()
    } catch (error) {
      console.error('Error approving review:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)

    try {
      const result = await rejectReview(review.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Review rejected')
      setShowRejectDialog(false)
      router.refresh()
    } catch (error) {
      console.error('Error rejecting review:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsRejecting(false)
    }
  }

  const handleToggleFeature = async () => {
    setIsTogglingFeature(true)

    try {
      const result = await toggleFeaturedReview(review.id, !review.is_featured)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(
        review.is_featured ? 'Review removed from featured' : 'Review featured successfully'
      )
      router.refresh()
    } catch (error) {
      console.error('Error toggling featured status:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsTogglingFeature(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const result = await deleteReview(review.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Review deleted successfully')
      setShowDeleteDialog(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  const customerName = review.customer?.full_name || review.customer?.email?.split('@')[0] || 'Customer'
  const initials = customerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const shouldTruncate = review.review_text && review.review_text.length > 300
  const displayText =
    shouldTruncate && !isExpanded
      ? review.review_text!.slice(0, 300) + '...'
      : review.review_text

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    approved: 'bg-green-500/10 text-green-500 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
  }

  if (variant === 'compact') {
    return (
      <Card className="p-4 bg-luxury-black/50 backdrop-blur-sm border-luxury-lightGray/10">
        <div className="flex gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={review.customer?.avatar_url || undefined} />
            <AvatarFallback className="bg-luxury-gold/20 text-luxury-gold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-luxury-pearl">{customerName}</h4>
                <StarRating rating={review.rating} size="sm" />
              </div>
              <span className="text-xs text-luxury-lightGray">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </span>
            </div>
            {review.review_text && (
              <p className="text-sm text-luxury-lightGray line-clamp-2">
                {review.review_text}
              </p>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(className)}
    >
      <Card
        className={cn(
          'overflow-hidden bg-luxury-black/50 backdrop-blur-md border-luxury-lightGray/10',
          'hover:border-luxury-gold/30 transition-all duration-300',
          variant === 'featured' && 'p-8',
          variant !== 'featured' && 'p-6'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <Avatar className={variant === 'featured' ? 'w-14 h-14' : 'w-12 h-12'}>
              <AvatarImage src={review.customer?.avatar_url || undefined} />
              <AvatarFallback className="bg-luxury-gold/20 text-luxury-gold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3
                  className={cn(
                    'font-medium text-luxury-pearl',
                    variant === 'featured' && 'text-lg'
                  )}
                >
                  {customerName}
                </h3>
                <CheckCircle className="w-4 h-4 text-luxury-gold" title="Verified Purchase" />
              </div>
              <StarRating rating={review.rating} size={variant === 'featured' ? 'md' : 'sm'} />
              <div className="flex items-center gap-3 text-xs text-luxury-lightGray">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </span>
                {review.route_from && review.route_to && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {review.route_from} → {review.route_to}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          {variant === 'admin' && (
            <div className="flex items-center gap-2">
              <Badge className={statusColors[review.status]}>{review.status}</Badge>
              {review.status === 'pending' && (
                <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" disabled={isApproving}>
                      {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Approve
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Approve Review</AlertDialogTitle>
                      <AlertDialogDescription>
                        Approve this review? It will be visible to all customers on the public reviews page.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isApproving}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleApprove} disabled={isApproving}>
                        {isApproving ? 'Approving...' : 'Approve Review'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {review.status === 'pending' && (
                <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" disabled={isRejecting}>
                      {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Reject
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject Review</AlertDialogTitle>
                      <AlertDialogDescription>
                        Reject this review? It will not be visible to customers and the reviewer will be notified.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isRejecting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleReject}
                        disabled={isRejecting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isRejecting ? 'Rejecting...' : 'Reject Review'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>

        {/* Review Text */}
        {review.review_text && (
          <div className="mb-4">
            <p className="text-luxury-lightGray leading-relaxed whitespace-pre-wrap">
              {displayText}
            </p>
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-luxury-gold hover:text-luxury-gold/80 text-sm mt-2 flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    Show less <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Read more <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Photo Gallery */}
        {review.photos && review.photos.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {review.photos.slice(0, 4).map((photo, index) => (
              <div
                key={index}
                className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsImageGalleryOpen(true)}
              >
                <img
                  src={photo}
                  alt={`Review photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Admin Response */}
        {review.admin_response && (
          <div className="mt-4 p-4 bg-luxury-gold/5 border border-luxury-gold/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-luxury-gold/20 text-luxury-gold border-luxury-gold/30">
                Admin Response
              </Badge>
              {review.admin_response_at && (
                <span className="text-xs text-luxury-lightGray">
                  {formatDistanceToNow(new Date(review.admin_response_at), { addSuffix: true })}
                </span>
              )}
            </div>
            <p className="text-luxury-lightGray text-sm">{review.admin_response}</p>
          </div>
        )}

        {/* Admin Response Form */}
        {variant === 'admin' && showResponseForm && (
          <div className="mt-4">
            <AdminResponseForm
              reviewId={review.id}
              onSuccess={() => {
                setShowResponseForm(false)
                router.refresh()
              }}
              onCancel={() => setShowResponseForm(false)}
            />
          </div>
        )}

        {/* Footer Actions */}
        {variant === 'admin' && (
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-luxury-lightGray/10">
              {!review.admin_response && (
                <Button
                  onClick={() => setShowResponseForm(!showResponseForm)}
                  size="sm"
                  variant={showResponseForm ? 'outline' : 'ghost'}
                  className="text-luxury-gold hover:text-luxury-gold/80"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  {showResponseForm ? 'Cancel' : 'Respond'}
                </Button>
              )}
              {review.status === 'pending' && (
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" disabled={isDeleting}>
                      {isDeleting && <Loader2 className="mr-2 h-3 h-3 animate-spin" />}
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Review</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this review? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Review'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button
                onClick={handleToggleFeature}
                size="sm"
                variant="ghost"
                className={review.is_featured ? 'text-luxury-gold' : ''}
                disabled={isTogglingFeature}
              >
                {isTogglingFeature && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                {review.is_featured ? '★ Featured' : 'Feature'}
              </Button>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
