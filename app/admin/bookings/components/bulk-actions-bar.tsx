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
import { X, CheckCircle, XCircle, FileDown, Trash2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { bulkUpdateBookingStatus, bulkDeleteBookings, exportBookingsToCSV } from '../actions'
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
  const [confirmAction, setConfirmAction] = useState<'confirm' | 'cancel' | 'delete' | null>(null)

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
      const csv = await exportBookingsToCSV(selectedBookingIds)
      
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

  const handleBulkDelete = async () => {
    setIsUpdating(true)
    try {
      const result = await bulkDeleteBookings(selectedBookingIds)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${selectedCount} booking${selectedCount !== 1 ? 's' : ''} deleted`)
        onClearSelection()
        router.refresh()
      }
    } catch (error) {
      toast.error('Failed to delete bookings')
    } finally {
      setIsUpdating(false)
      setConfirmAction(null)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8 px-2"
          >
            <X className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {selectedCount} {selectedCount === 1 ? 'booking' : 'bookings'} selected
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isUpdating}>
              Bulk Actions <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setConfirmAction('confirm')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm Selected
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setConfirmAction('cancel')}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Selected
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExport}>
              <FileDown className="mr-2 h-4 w-4" />
              Export to CSV
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setConfirmAction('delete')}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'confirm' ? 'Confirm Bookings' : confirmAction === 'delete' ? 'Delete Bookings' : 'Cancel Bookings'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'delete' ? (
                <>Are you sure you want to permanently delete {selectedCount} selected booking{selectedCount !== 1 ? 's' : ''}? This will remove all related data and cannot be undone.</>
              ) : (
                <>Are you sure you want to {confirmAction === 'confirm' ? 'confirm' : 'cancel'}{' '}
                {selectedCount} selected booking{selectedCount !== 1 ? 's' : ''}?
                {confirmAction === 'cancel' && ' This action cannot be undone.'}</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction === 'delete') {
                  handleBulkDelete()
                } else {
                  handleBulkStatusUpdate(confirmAction === 'confirm' ? 'confirmed' : 'cancelled')
                }
              }}
              disabled={isUpdating}
              className={confirmAction === 'cancel' || confirmAction === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {isUpdating ? 'Processing...' : confirmAction === 'confirm' ? 'Confirm All' : confirmAction === 'delete' ? 'Delete All' : 'Cancel All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}