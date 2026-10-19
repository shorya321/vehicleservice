'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AdminResponseForm } from '@/components/reviews/admin-response-form'

interface AdminReplyModalProps {
  reviewId: string
  onClose: () => void
  onSuccess: () => void
}

export function AdminReplyModal({ reviewId, onClose, onSuccess }: AdminReplyModalProps) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Reply</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a professional response to this review that will be visible to all customers.
          </DialogDescription>
        </DialogHeader>
        <AdminResponseForm
          reviewId={reviewId}
          onSuccess={onSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}
