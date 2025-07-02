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
  UserCheck,
  UserX,
  Trash2,
  FileDown,
  Mail,
  ShieldOff
} from "lucide-react"
import { 
  bulkUpdateUserStatus, 
  bulkDeleteUsers, 
  exportUsersToCSV,
  bulkDisable2FA,
  bulkSendPasswordReset,
  bulkSendVerificationEmails
} from "../actions"
import { useRouter } from "next/navigation"
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

interface BulkActionsBarProps {
  selectedCount: number
  selectedUserIds: string[]
  onClearSelection: () => void
}

export function BulkActionsBar({ 
  selectedCount, 
  selectedUserIds, 
  onClearSelection 
}: BulkActionsBarProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'suspend' | null
    title: string
    description: string
  }>({ type: null, title: '', description: '' })

  const handleBulkAction = async (
    action: 'activate' | 'suspend' | 'delete' | 'export' | 'disable-2fa' | 'send-reset' | 'send-verification'
  ) => {
    if (action === 'delete') {
      setConfirmAction({
        type: 'delete',
        title: 'Delete Users',
        description: `Are you sure you want to delete ${selectedCount} user${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`
      })
      return
    }

    if (action === 'suspend') {
      setConfirmAction({
        type: 'suspend',
        title: 'Suspend Users',
        description: `Are you sure you want to suspend ${selectedCount} user${selectedCount > 1 ? 's' : ''}? They will not be able to access their accounts.`
      })
      return
    }

    setLoading(true)
    try {
      if (action === 'activate') {
        const result = await bulkUpdateUserStatus(selectedUserIds, 'active')
        if (!result.error) {
          onClearSelection()
          router.refresh()
        }
      } else if (action === 'export') {
        const result = await exportUsersToCSV(selectedUserIds)
        if (result.data) {
          // Create blob and download
          const blob = new Blob([result.data], { type: 'text/csv' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      } else if (action === 'disable-2fa') {
        const result = await bulkDisable2FA(selectedUserIds)
        if (!result.error) {
          onClearSelection()
          router.refresh()
        }
      } else if (action === 'send-reset') {
        const result = await bulkSendPasswordReset(selectedUserIds)
        if (!result.error) {
          onClearSelection()
        }
      } else if (action === 'send-verification') {
        const result = await bulkSendVerificationEmails(selectedUserIds)
        if (!result.error) {
          onClearSelection()
          router.refresh()
        }
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
        const result = await bulkDeleteUsers(selectedUserIds)
        if (!result.error) {
          onClearSelection()
          router.refresh()
        }
      } else if (confirmAction.type === 'suspend') {
        const result = await bulkUpdateUserStatus(selectedUserIds, 'suspended')
        if (!result.error) {
          onClearSelection()
          router.refresh()
        }
      }
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
            {selectedCount} user{selectedCount > 1 ? 's' : ''} selected
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
                <UserCheck className="mr-2 h-4 w-4" />
                Activate All
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleBulkAction('suspend')}
                disabled={loading}
              >
                <UserX className="mr-2 h-4 w-4" />
                Suspend All
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleBulkAction('send-reset')}
                disabled={loading}
              >
                <Mail className="mr-2 h-4 w-4" />
                Send Password Reset
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleBulkAction('send-verification')}
                disabled={loading}
              >
                <Mail className="mr-2 h-4 w-4" />
                Send Verification Email
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleBulkAction('disable-2fa')}
                disabled={loading}
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                Disable 2FA
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