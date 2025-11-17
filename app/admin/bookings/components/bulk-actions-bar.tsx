'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X, CheckCircle, XCircle, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import { bulkUpdateBookingStatus, exportBookingsToCSV } from '../actions'
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
  selectedBookingIds: string[]
  onClearSelection: () => void
}

export function BulkActionsBar({
  selectedCount,
  selectedBookingIds,
  onClearSelection
}: BulkActionsBarProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'confirm' | 'cancel' | null>(null)

  const handleBulkStatusUpdate = async (status: 'confirmed' | 'cancelled') => {
    setIsUpdating(true)
    try {
      await bulkUpdateBookingStatus(selectedBookingIds, status)
      toast.success(`${selectedCount} bookings ${status === 'confirmed' ? 'confirmed' : 'cancelled'}`)
      onClearSelection()
      router.refresh()
    } catch (error) {
      toast.error(`Failed to update booking status`)
    } finally {
      setIsUpdating(false)
      setConfirmAction(null)
    }
  }

  const handleExport = async () => {
    try {
      const csv = await exportBookingsToCSV({ limit: 10000 })
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bookings-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Bookings exported successfully')
    } catch (error) {
      toast.error('Failed to export bookings')
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
            {selectedCount} {selectedCount === 1 ? 'booking' : 'bookings'} selected
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmAction('confirm')}
            disabled={isUpdating}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Confirm Selected
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmAction('cancel')}
            disabled={isUpdating}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <XCircle className="h-4 w-4" />
            Cancel Selected
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Export All
          </Button>
        </div>
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'confirm' ? 'Confirm Bookings' : 'Cancel Bookings'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmAction === 'confirm' ? 'confirm' : 'cancel'}{' '}
              {selectedCount} selected booking{selectedCount !== 1 ? 's' : ''}?
              {confirmAction === 'cancel' && ' This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleBulkStatusUpdate(confirmAction === 'confirm' ? 'confirmed' : 'cancelled')}
              disabled={isUpdating}
              className={confirmAction === 'cancel' ? 'bg-destructive text-destructive-foreground' : ''}
            >
              {isUpdating ? 'Processing...' : confirmAction === 'confirm' ? 'Confirm All' : 'Cancel All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}