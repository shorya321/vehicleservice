'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, AlertCircle } from 'lucide-react'
import { rejectAssignment } from '../actions'

interface RejectAssignmentModalProps {
  assignmentId: string
  bookingNumber: string
  onClose: () => void
}

const REJECTION_REASONS = [
  { value: 'vehicle_unavailable', label: 'Vehicle Unavailable' },
  { value: 'driver_unavailable', label: 'Driver Unavailable' },
  { value: 'both_unavailable', label: 'Vehicle & Driver Unavailable' },
  { value: 'scheduling_conflict', label: 'Scheduling Conflict' },
  { value: 'maintenance', label: 'Vehicle in Maintenance' },
  { value: 'other', label: 'Other Reason' },
]

export function RejectAssignmentModal({
  assignmentId,
  bookingNumber,
  onClose,
}: RejectAssignmentModalProps) {
  const router = useRouter()
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isRejecting, setIsRejecting] = useState(false)

  const handleReject = async () => {
    if (!selectedReason) {
      toast.error('Please select a rejection reason')
      return
    }

    setIsRejecting(true)
    try {
      // Format the rejection reason with category and notes
      const reasonLabel = REJECTION_REASONS.find(r => r.value === selectedReason)?.label || selectedReason
      const fullReason = notes
        ? `${reasonLabel}: ${notes}`
        : reasonLabel

      await rejectAssignment(assignmentId, fullReason)

      toast.success('Booking assignment rejected successfully')
      router.refresh()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject assignment')
      console.error('Rejection error:', error)
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Booking Assignment</DialogTitle>
          <DialogDescription>
            Reject booking #{bookingNumber}. Please provide a reason for rejection so the admin can reassign to another vendor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Provide any additional details about why you cannot accept this booking..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Important:</p>
                <ul className="space-y-1 ml-2">
                  <li>• The admin will be notified of this rejection</li>
                  <li>• The booking will be reassigned to another vendor</li>
                  <li>• Provide clear reasons to help with reassignment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isRejecting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isRejecting || !selectedReason}
          >
            {isRejecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              'Reject Assignment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}