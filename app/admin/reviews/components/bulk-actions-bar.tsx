'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { X, ChevronDown, CheckCircle, XCircle, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { bulkApproveReviews, bulkRejectReviews, bulkDeleteReviews } from '../actions'
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

interface BulkActionsBarProps {
  selectedCount: number
  selectedReviewIds: string[]
  onClearSelection: () => void
}

export function BulkActionsBar({
  selectedCount,
  selectedReviewIds,
  onClearSelection
}: BulkActionsBarProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'delete' | null>(null)

  const handleBulkApprove = async () => {
    setIsProcessing(true)
    try {
      const result = await bulkApproveReviews(selectedReviewIds)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success(`${selectedCount} review${selectedCount !== 1 ? 's' : ''} approved successfully`)
      onClearSelection()
      router.refresh()
    } catch (error) {
      toast.error('Failed to approve reviews')
    } finally {
      setIsProcessing(false)
      setConfirmAction(null)
    }
  }

  const handleBulkReject = async () => {
    setIsProcessing(true)
    try {
      const result = await bulkRejectReviews(selectedReviewIds)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success(`${selectedCount} review${selectedCount !== 1 ? 's' : ''} rejected`)
      onClearSelection()
      router.refresh()
    } catch (error) {
      toast.error('Failed to reject reviews')
    } finally {
      setIsProcessing(false)
      setConfirmAction(null)
    }
  }

  const handleBulkDelete = async () => {
    setIsProcessing(true)
    try {
      const result = await bulkDeleteReviews(selectedReviewIds)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success(`${selectedCount} review${selectedCount !== 1 ? 's' : ''} deleted successfully`)
      onClearSelection()
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete reviews')
    } finally {
      setIsProcessing(false)
      setConfirmAction(null)
    }
  }

  const handleConfirmAction = async () => {
    switch (confirmAction) {
      case 'approve':
        await handleBulkApprove()
        break
      case 'reject':
        await handleBulkReject()
        break
      case 'delete':
        await handleBulkDelete()
        break
    }
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={onClearSelection}>
            <X className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {selectedCount} {selectedCount === 1 ? 'review' : 'reviews'} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isProcessing}>
                Bulk Actions
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setConfirmAction('approve')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfirmAction('reject')}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setConfirmAction('delete')}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={() => !isProcessing && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'approve' && 'Approve Reviews'}
              {confirmAction === 'reject' && 'Reject Reviews'}
              {confirmAction === 'delete' && 'Delete Reviews'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'approve' && (
                <>
                  Are you sure you want to approve {selectedCount} selected review{selectedCount !== 1 ? 's' : ''}?
                  {' '}They will be visible to all customers on the public reviews page.
                </>
              )}
              {confirmAction === 'reject' && (
                <>
                  Are you sure you want to reject {selectedCount} selected review{selectedCount !== 1 ? 's' : ''}?
                  {' '}They will not be visible to customers.
                </>
              )}
              {confirmAction === 'delete' && (
                <>
                  Are you sure you want to delete {selectedCount} selected review{selectedCount !== 1 ? 's' : ''}?
                  {' '}This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={isProcessing}
              className={confirmAction === 'delete' || confirmAction === 'reject' ? 'bg-destructive text-destructive-foreground' : ''}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isProcessing ? 'Processing...' : (
                <>
                  {confirmAction === 'approve' && 'Approve All'}
                  {confirmAction === 'reject' && 'Reject All'}
                  {confirmAction === 'delete' && 'Delete All'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
