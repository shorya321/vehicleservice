import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getContactSubmission } from '../actions'
import { SubmissionDetail } from '../components/submission-detail'

export const metadata: Metadata = {
  title: 'Contact Submission Detail | Admin',
  description: 'View and manage a contact submission',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ContactSubmissionDetailPage({
  params,
}: PageProps) {
  const { id } = await params
  const submission = await getContactSubmission(id)

  if (!submission) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/contact">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Submission Details
          </h1>
          <p className="text-muted-foreground">
            From {submission.name} &mdash; {submission.email}
          </p>
        </div>
      </div>

      <SubmissionDetail submission={submission} />
    </div>
  )
}
