"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  X,
  ChevronDown,
  CheckCircle,
  XCircle,
  Trash2,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { bulkDeleteVendorApplications, bulkUpdateVendorApplicationStatus } from "../actions"
import { useRouter } from "next/navigation"

interface BulkActionsBarProps {
  selectedCount: number
  selectedIds: string[]
  onClearSelection: () => void
}

export function BulkActionsBar({ selectedCount, selectedIds, onClearSelection }: BulkActionsBarProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'reject' | null
    title: string
    description: string
  }>({ type: null, title: '', description: '' })

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (action === 'delete') {
      setConfirmAction({
        type: 'delete',
        title: 'Delete Applications',
        description: `Are you sure you want to delete ${selectedCount} application${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`
      })
      return
    }

    if (action === 'reject') {
      setConfirmAction({
        type: 'reject',
        title: 'Reject Applications',
        description: `Are you sure you want to reject ${selectedCount} application${selectedCount > 1 ? 's' : ''}?`
      })
      return
    }

    setLoading(true)
    try {
      await bulkUpdateVendorApplicationStatus(selectedIds, 'approved')
      toast.success(`${selectedCount} application${selectedCount > 1 ? 's' : ''} approved`)
      onClearSelection()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve applications')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmAction = async () => {
    if (!confirmAction.type) return

    setLoading(true)
    try {
      if (confirmAction.type === 'delete') {
        await bulkDeleteVendorApplications(selectedIds)
        toast.success(`${selectedCount} application${selectedCount > 1 ? 's' : ''} deleted`)
      } else if (confirmAction.type === 'reject') {
        await bulkUpdateVendorApplicationStatus(selectedIds, 'rejected')
        toast.success(`${selectedCount} application${selectedCount > 1 ? 's' : ''} rejected`)
      }
      onClearSelection()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to complete action')
    } finally {
      setLoading(false)
      setConfirmAction({ type: null, title: '', description: '' })
    }
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClearSelection} className="h-8 px-2">
            <X className="h-4 w-4" />
          </Button>
          <p className="text-sm font-medium">
            {selectedCount} application{selectedCount > 1 ? 's' : ''} selected
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={loading}>
                Bulk Actions
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleBulkAction('approve')} disabled={loading}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('reject')} disabled={loading}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject All
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleBulkAction('delete')} disabled={loading} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={!!confirmAction.type} onOpenChange={(open) => !open && setConfirmAction({ type: null, title: '', description: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} disabled={loading} className={confirmAction.type === 'delete' ? 'bg-destructive text-destructive-foreground' : ''}>
              {loading ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
