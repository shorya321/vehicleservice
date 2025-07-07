"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

interface VendorApplicationActionsProps {
  applicationId: string
}

export function VendorApplicationActions({ applicationId }: VendorApplicationActionsProps) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [adminNotes, setAdminNotes] = useState("")

  const handleApprove = async () => {
    setIsApproving(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase.rpc('approve_vendor_application', {
        p_application_id: applicationId,
        p_admin_notes: adminNotes || null,
      })

      if (error) throw error

      if (data?.error) {
        throw new Error(data.error)
      }

      toast.success("Application approved successfully!")
      router.refresh()
      router.push('/admin/vendor-applications')
    } catch (error) {
      console.error('Error approving application:', error)
      toast.error("Failed to approve application")
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason")
      return
    }

    setIsRejecting(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase.rpc('reject_vendor_application', {
        p_application_id: applicationId,
        p_rejection_reason: rejectionReason,
        p_admin_notes: adminNotes || null,
      })

      if (error) throw error

      if (data?.error) {
        throw new Error(data.error)
      }

      toast.success("Application rejected")
      setShowRejectDialog(false)
      router.refresh()
      router.push('/admin/vendor-applications')
    } catch (error) {
      console.error('Error rejecting application:', error)
      toast.error("Failed to reject application")
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
          <Textarea
            id="admin-notes"
            placeholder="Add any internal notes about this application..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="mt-2"
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            These notes are for internal use only
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={handleApprove}
            disabled={isApproving || isRejecting}
          >
            {isApproving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Approve
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => setShowRejectDialog(true)}
            disabled={isApproving || isRejecting}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Reject
          </Button>
        </div>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this vendor application. This will be visible to the applicant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please provide specific reasons for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
            >
              {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}