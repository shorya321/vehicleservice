'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteReview } from '../actions'
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

interface CustomerBulkActionsBarProps {
  selectedCount: number
  selectedReviewIds: string[]
  onClearSelection: () => void
}

export function CustomerBulkActionsBar({
  selectedCount,
  selectedReviewIds,
  onClearSelection
}: CustomerBulkActionsBarProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleBulkDelete = async () => {
    setIsDeleting(true)
    try {
      // Delete each review individually
      const deletePromises = selectedReviewIds.map(id => deleteReview(id))
      const results = await Promise.all(deletePromises)

      const errors = results.filter(r => r.error)
      if (errors.length > 0) {
        toast.error(`Failed to delete ${errors.length} review${errors.length !== 1 ? 's' : ''}`)
      } else {
        toast.success(`${selectedCount} review${selectedCount !== 1 ? 's' : ''} deleted successfully`)
      }

      onClearSelection()
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete reviews')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear Selection
          </Button>
          <span className="text-sm font-medium">
            {selectedCount} pending {selectedCount === 1 ? 'review' : 'reviews'} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={() => !isDeleting && setShowDeleteConfirm(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reviews</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} selected review{selectedCount !== 1 ? 's' : ''}?
              {' '}This action cannot be undone. Only pending reviews can be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? 'Deleting...' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
