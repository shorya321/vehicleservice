'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { approveReview, rejectReview } from '../../actions'
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

interface ApproveRejectButtonsProps {
  reviewId: string
}

export function ApproveRejectButtons({ reviewId }: ApproveRejectButtonsProps) {
  const router = useRouter()
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAction = async () => {
    if (!actionType) return

    setIsProcessing(true)
    try {
      const result = actionType === 'approve'
        ? await approveReview(reviewId)
        : await rejectReview(reviewId)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Review ${actionType}d successfully`)
        router.push('/admin/reviews')
        router.refresh()
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsProcessing(false)
      setActionType(null)
    }
  }

  return (
    <>
      <Button
        onClick={() => setActionType('approve')}
        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        <CheckCircle className="h-4 w-4" />
        Approve
      </Button>
      <Button
        onClick={() => setActionType('reject')}
        variant="destructive"
        className="gap-2"
      >
        <XCircle className="h-4 w-4" />
        Reject
      </Button>

      <AlertDialog
        open={actionType !== null}
        onOpenChange={(open) => {
          if (!open) setActionType(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' && 'Approve Review'}
              {actionType === 'reject' && 'Reject Review'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve' && 'This review will be visible to all customers on the public reviews page.'}
              {actionType === 'reject' && 'This review will not be visible to customers. You can still add a response to inform the customer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={isProcessing}
              className={actionType === 'reject' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isProcessing ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
