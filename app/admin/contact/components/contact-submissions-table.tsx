'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  MoreHorizontal,
  Eye,
  Trash2,
  Archive,
  CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  ContactSubmission,
  updateSubmissionStatus,
  deleteSubmission,
} from '../actions'

interface ContactSubmissionsTableProps {
  submissions: ContactSubmission[]
}

const SUBJECT_LABELS: Record<string, string> = {
  general: 'General Inquiry',
  booking: 'Booking Assistance',
  corporate: 'Corporate Services',
  fleet: 'Fleet Partnership',
  feedback: 'Feedback',
  other: 'Other',
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'new':
      return <Badge variant="default">New</Badge>
    case 'read':
      return <Badge variant="secondary">Read</Badge>
    case 'replied':
      return <Badge className="bg-green-600/20 text-green-500 border-green-600/30">Replied</Badge>
    case 'archived':
      return <Badge variant="outline">Archived</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'urgent':
      return <Badge variant="destructive">Urgent</Badge>
    case 'high':
      return <Badge className="bg-orange-600/20 text-orange-500 border-orange-600/30">High</Badge>
    case 'normal':
      return <Badge variant="secondary">Normal</Badge>
    case 'low':
      return <Badge variant="outline">Low</Badge>
    default:
      return <Badge variant="secondary">{priority}</Badge>
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function ContactSubmissionsTable({
  submissions,
}: ContactSubmissionsTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleMarkRead = async (id: string) => {
    try {
      await updateSubmissionStatus(id, 'read')
      toast.success('Marked as read')
      router.refresh()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleArchive = async (id: string) => {
    try {
      await updateSubmissionStatus(id, 'archived')
      toast.success('Submission archived')
      router.refresh()
    } catch {
      toast.error('Failed to archive submission')
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await deleteSubmission(deletingId)
      toast.success('Submission deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete submission')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  No contact submissions found
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.name}</TableCell>
                  <TableCell className="text-sm">{sub.email}</TableCell>
                  <TableCell className="text-sm">
                    {SUBJECT_LABELS[sub.subject] || sub.subject}
                  </TableCell>
                  <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  <TableCell>{getPriorityBadge(sub.priority)}</TableCell>
                  <TableCell className="text-sm">
                    {formatDate(sub.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/contact/${sub.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {sub.status === 'new' && (
                          <DropdownMenuItem
                            onClick={() => handleMarkRead(sub.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Read
                          </DropdownMenuItem>
                        )}
                        {sub.status !== 'archived' && (
                          <DropdownMenuItem
                            onClick={() => handleArchive(sub.id)}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeletingId(sub.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!deletingId}
        onOpenChange={() => setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact submission? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
