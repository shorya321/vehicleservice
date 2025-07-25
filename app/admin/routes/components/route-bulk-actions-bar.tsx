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
  FileDown,
  Star,
  StarOff
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
import { bulkDeleteRoutes } from "../actions"
import { useRouter } from "next/navigation"

interface RouteBulkActionsBarProps {
  selectedCount: number
  selectedIds: string[]
  onClearSelection: () => void
}

export function RouteBulkActionsBar({ selectedCount, selectedIds, onClearSelection }: RouteBulkActionsBarProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'deactivate' | null
    title: string
    description: string
  }>({ type: null, title: '', description: '' })

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete' | 'export' | 'mark-popular' | 'unmark-popular') => {
    if (action === 'delete') {
      setConfirmAction({
        type: 'delete',
        title: 'Delete Routes',
        description: `Are you sure you want to delete ${selectedCount} route${selectedCount > 1 ? 's' : ''}? This action cannot be undone and will remove all related vendor services.`
      })
      return
    }

    if (action === 'deactivate') {
      setConfirmAction({
        type: 'deactivate',
        title: 'Deactivate Routes',
        description: `Are you sure you want to deactivate ${selectedCount} route${selectedCount > 1 ? 's' : ''}? They will not be available for bookings.`
      })
      return
    }

    setLoading(true)
    try {
      if (action === 'activate') {
        // TODO: Implement bulk activate
        toast.info('Bulk activate feature coming soon')
      } else if (action === 'mark-popular') {
        // TODO: Implement bulk mark as popular
        toast.info('Bulk mark as popular feature coming soon')
      } else if (action === 'unmark-popular') {
        // TODO: Implement bulk unmark as popular
        toast.info('Bulk unmark as popular feature coming soon')
      } else if (action === 'export') {
        // TODO: Implement export
        toast.info('Export feature coming soon')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmAction = async () => {
    if (!confirmAction.type) return

    setLoading(true)
    try {
      if (confirmAction.type === 'delete') {
        const result = await bulkDeleteRoutes(selectedIds)
        toast.success(`Successfully deleted ${result.count} route${result.count > 1 ? 's' : ''}`)
        onClearSelection()
        router.refresh()
      } else if (confirmAction.type === 'deactivate') {
        // TODO: Implement bulk deactivate
        toast.info('Bulk deactivate feature coming soon')
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
      toast.error('Failed to complete action')
    } finally {
      setLoading(false)
      setConfirmAction({ type: null, title: '', description: '' })
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
          <p className="text-sm font-medium">
            {selectedCount} route{selectedCount > 1 ? 's' : ''} selected
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={loading}
              >
                Bulk Actions
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleBulkAction('activate')}
                disabled={loading}
              >
                <ToggleRight className="mr-2 h-4 w-4" />
                Activate All
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleBulkAction('deactivate')}
                disabled={loading}
              >
                <ToggleLeft className="mr-2 h-4 w-4" />
                Deactivate All
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleBulkAction('mark-popular')}
                disabled={loading}
              >
                <Star className="mr-2 h-4 w-4" />
                Mark as Popular
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleBulkAction('unmark-popular')}
                disabled={loading}
              >
                <StarOff className="mr-2 h-4 w-4" />
                Remove from Popular
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleBulkAction('export')}
                disabled={loading}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleBulkAction('delete')}
                disabled={loading}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog 
        open={!!confirmAction.type}
        onOpenChange={(open) => !open && setConfirmAction({ type: null, title: '', description: '' })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAction}
              disabled={loading}
              className={confirmAction.type === 'delete' ? 'bg-destructive text-destructive-foreground' : ''}
            >
              {loading ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}