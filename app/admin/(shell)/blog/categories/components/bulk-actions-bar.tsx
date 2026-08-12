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
  ToggleLeft,
  ToggleRight,
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
import { bulkDeleteBlogCategories, bulkToggleBlogCategoryStatus } from "../actions"
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
    type: 'delete' | 'deactivate' | null
    title: string
    description: string
  }>({ type: null, title: '', description: '' })

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (action === 'delete') {
      setConfirmAction({
        type: 'delete',
        title: 'Delete Categories',
        description: `Are you sure you want to delete ${selectedCount} categor${selectedCount > 1 ? 'ies' : 'y'}? This action cannot be undone.`
      })
      return
    }

    if (action === 'deactivate') {
      setConfirmAction({
        type: 'deactivate',
        title: 'Deactivate Categories',
        description: `Are you sure you want to deactivate ${selectedCount} categor${selectedCount > 1 ? 'ies' : 'y'}?`
      })
      return
    }

    setLoading(true)
    try {
      await bulkToggleBlogCategoryStatus(selectedIds, true)
      toast.success(`${selectedCount} categor${selectedCount > 1 ? 'ies' : 'y'} activated`)
      onClearSelection()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to activate categories')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmAction = async () => {
    if (!confirmAction.type) return

    setLoading(true)
    try {
      if (confirmAction.type === 'delete') {
        await bulkDeleteBlogCategories(selectedIds)
        toast.success(`${selectedCount} categor${selectedCount > 1 ? 'ies' : 'y'} deleted`)
      } else if (confirmAction.type === 'deactivate') {
        await bulkToggleBlogCategoryStatus(selectedIds, false)
        toast.success(`${selectedCount} categor${selectedCount > 1 ? 'ies' : 'y'} deactivated`)
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
            {selectedCount} categor{selectedCount > 1 ? 'ies' : 'y'} selected
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
              <DropdownMenuItem onClick={() => handleBulkAction('activate')} disabled={loading}>
                <ToggleRight className="mr-2 h-4 w-4" />
                Activate All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('deactivate')} disabled={loading}>
                <ToggleLeft className="mr-2 h-4 w-4" />
                Deactivate All
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
