'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Send,
  Save,
  Loader2,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  User,
} from 'lucide-react'
import {
  ContactSubmission,
  updateSubmissionStatus,
  updateSubmissionPriority,
  addAdminNote,
  replyToSubmission,
} from '../actions'

const SUBJECT_LABELS: Record<string, string> = {
  general: 'General Inquiry',
  booking: 'Booking Assistance',
  corporate: 'Corporate Services',
  fleet: 'Fleet Partnership',
  feedback: 'Feedback',
  other: 'Other',
}

interface SubmissionDetailProps {
  submission: ContactSubmission
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function SubmissionDetail({ submission }: SubmissionDetailProps) {
  const router = useRouter()
  const [status, setStatus] = useState(submission.status)
  const [priority, setPriority] = useState(submission.priority)
  const [notes, setNotes] = useState(submission.admin_notes || '')
  const [replyMessage, setReplyMessage] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [isSendingReply, setIsSendingReply] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateSubmissionStatus(submission.id, newStatus)
      setStatus(newStatus)
      toast.success('Status updated')
      router.refresh()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handlePriorityChange = async (newPriority: string) => {
    try {
      await updateSubmissionPriority(submission.id, newPriority)
      setPriority(newPriority)
      toast.success('Priority updated')
      router.refresh()
    } catch {
      toast.error('Failed to update priority')
    }
  }

  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    try {
      await addAdminNote(submission.id, notes)
      toast.success('Notes saved')
    } catch {
      toast.error('Failed to save notes')
    } finally {
      setIsSavingNotes(false)
    }
  }

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a reply message')
      return
    }
    setIsSendingReply(true)
    try {
      await replyToSubmission(submission.id, replyMessage)
      setStatus('replied')
      setReplyMessage('')
      toast.success('Reply sent successfully')
      router.refresh()
    } catch {
      toast.error('Failed to send reply')
    } finally {
      setIsSendingReply(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Submission Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {SUBJECT_LABELS[submission.subject] || submission.subject}
            </CardTitle>
            <CardDescription>
              Submitted on {formatDateTime(submission.created_at)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {submission.message}
            </p>
          </CardContent>
        </Card>

        {/* Reply Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Reply to {submission.name}
            </CardTitle>
            <CardDescription>
              Send a response via email to {submission.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply here..."
              rows={5}
            />
            <Button
              onClick={handleSendReply}
              disabled={isSendingReply || !replyMessage.trim()}
            >
              {isSendingReply ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Reply
            </Button>
          </CardContent>
        </Card>

        {/* Admin Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Notes</CardTitle>
            <CardDescription>Internal notes (not visible to the customer)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes about this submission..."
              rows={3}
            />
            <Button
              variant="outline"
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
            >
              {isSavingNotes ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Notes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right: Sidebar */}
      <div className="space-y-6">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{submission.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a
                href={`mailto:${submission.email}`}
                className="text-sm text-primary hover:underline"
              >
                {submission.email}
              </a>
            </div>
            {submission.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${submission.phone}`}
                  className="text-sm text-primary hover:underline"
                >
                  {submission.phone}
                </a>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {formatDateTime(submission.created_at)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Status & Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Manage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Priority
              </label>
              <Select value={priority} onValueChange={handlePriorityChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Submitted:</span>
              <br />
              {formatDateTime(submission.created_at)}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Last Updated:</span>
              <br />
              {formatDateTime(submission.updated_at)}
            </div>
            {submission.replied_at && (
              <div className="text-sm">
                <span className="text-muted-foreground">Replied:</span>
                <br />
                {formatDateTime(submission.replied_at)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
