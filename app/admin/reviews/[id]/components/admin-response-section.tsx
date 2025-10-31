'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Edit, Trash2, Loader2, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { addAdminResponse, updateAdminResponse, deleteAdminResponse } from '../../actions'
import { format } from 'date-fns'
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

interface AdminResponseSectionProps {
  reviewId: string
  adminResponse: string | null
  adminResponseAt: string | null
}

export function AdminResponseSection({
  reviewId,
  adminResponse: initialResponse,
  adminResponseAt,
}: AdminResponseSectionProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [response, setResponse] = useState(initialResponse || '')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const hasResponse = initialResponse !== null

  const handleSave = async () => {
    if (!response.trim()) {
      toast.error('Response cannot be empty')
      return
    }

    setIsProcessing(true)
    try {
      const result = hasResponse
        ? await updateAdminResponse(reviewId, response)
        : await addAdminResponse({ reviewId, response })

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(hasResponse ? 'Response updated successfully' : 'Response added successfully')
        setIsEditing(false)
        setIsAdding(false)
        router.refresh()
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    setIsProcessing(true)
    try {
      const result = await deleteAdminResponse(reviewId)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Response deleted successfully')
        setShowDeleteConfirm(false)
        router.refresh()
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    setResponse(initialResponse || '')
    setIsEditing(false)
    setIsAdding(false)
  }

  if (isAdding || (isEditing && hasResponse)) {
    return (
      <div>
        <h4 className="text-sm font-medium mb-3">
          {isAdding ? 'Add Admin Response' : 'Edit Admin Response'}
        </h4>
        <div className="space-y-3">
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Write your response to the customer..."
            className="min-h-[120px]"
            disabled={isProcessing}
          />
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={isProcessing || !response.trim()}
              className="gap-2"
            >
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              {isProcessing ? 'Saving...' : 'Save Response'}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={isProcessing}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (hasResponse && initialResponse) {
    return (
      <>
        <div className="p-4 bg-muted/50 border rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-luxury-gold" />
              <Badge variant="secondary">
                Admin Response
              </Badge>
              {adminResponseAt && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(adminResponseAt), 'MMM d, yyyy')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsEditing(true)}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <Edit className="h-3 w-3" />
                Edit
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="ghost"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {initialResponse}
          </p>
        </div>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Admin Response</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this admin response? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isProcessing}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessing ? 'Deleting...' : 'Delete Response'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  // No response exists
  return (
    <div>
      <h4 className="text-sm font-medium mb-3">Admin Response</h4>
      <div className="p-4 border border-dashed rounded-lg text-center">
        <p className="text-sm text-muted-foreground mb-3">
          No admin response yet. Add a response to communicate with the customer.
        </p>
        <Button
          onClick={() => setIsAdding(true)}
          variant="outline"
          className="gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Add Response
        </Button>
      </div>
    </div>
  )
}
