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
  Eye,
  EyeOff,
  Star,
  StarOff,
  Archive,
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
import { bulkDeleteBlogPosts, bulkToggleBlogPostStatus, bulkToggleBlogPostFeatured } from "../actions"
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
    type: 'delete' | null
    title: string
    description: string
  }>({ type: null, title: '', description: '' })

  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'feature' | 'unfeature' | 'archive' | 'delete') => {
    if (action === 'delete') {
      setConfirmAction({
        type: 'delete',
        title: 'Delete Blog Posts',
        description: `Are you sure you want to delete ${selectedCount} blog post${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`
      })
      return
    }

    setLoading(true)
    try {
      if (action === 'publish') {
        await bulkToggleBlogPostStatus(selectedIds, 'published')
        toast.success(`${selectedCount} post${selectedCount > 1 ? 's' : ''} published`)
      } else if (action === 'unpublish') {
        await bulkToggleBlogPostStatus(selectedIds, 'draft')
        toast.success(`${selectedCount} post${selectedCount > 1 ? 's' : ''} unpublished`)
      } else if (action === 'feature') {
        await bulkToggleBlogPostFeatured(selectedIds, true)
        toast.success(`${selectedCount} post${selectedCount > 1 ? 's' : ''} featured`)
      } else if (action === 'unfeature') {
        await bulkToggleBlogPostFeatured(selectedIds, false)
        toast.success(`${selectedCount} post${selectedCount > 1 ? 's' : ''} unfeatured`)
      } else if (action === 'archive') {
        await bulkToggleBlogPostStatus(selectedIds, 'archived')
        toast.success(`${selectedCount} post${selectedCount > 1 ? 's' : ''} archived`)
      }
      onClearSelection()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to complete action')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmAction = async () => {
    if (!confirmAction.type) return

    setLoading(true)
    try {
      await bulkDeleteBlogPosts(selectedIds)
      toast.success(`${selectedCount} post${selectedCount > 1 ? 's' : ''} deleted`)
      onClearSelection()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete posts')
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
            {selectedCount} post{selectedCount > 1 ? 's' : ''} selected
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
                onClick={() => handleBulkAction('publish')}
                disabled={loading}
              >
                <Eye className="mr-2 h-4 w-4" />
                Publish All
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleBulkAction('unpublish')}
                disabled={loading}
              >
                <EyeOff className="mr-2 h-4 w-4" />
                Unpublish All
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleBulkAction('feature')}
                disabled={loading}
              >
                <Star className="mr-2 h-4 w-4" />
                Feature All
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleBulkAction('unfeature')}
                disabled={loading}
              >
                <StarOff className="mr-2 h-4 w-4" />
                Unfeature All
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleBulkAction('archive')}
                disabled={loading}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive All
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
              className="bg-destructive text-destructive-foreground"
            >
              {loading ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
