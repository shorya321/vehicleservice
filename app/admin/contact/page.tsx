import { Metadata } from 'next'
import {
  MessageSquare,
  MessageSquarePlus,
  MessageSquareReply,
  Archive,
} from 'lucide-react'
import {
  getContactSubmissions,
  getContactStats,
  ContactSubmissionFilters,
} from './actions'
import { ContactSubmissionsTable } from './components/contact-submissions-table'
import { ContactFilters } from './components/contact-filters'
import { CustomPagination } from '@/components/ui/custom-pagination'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Contact Submissions | Admin',
  description: 'Manage contact form submissions',
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    priority?: string
    page?: string
  }>
}

export default async function ContactSubmissionsPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams = await searchParams

  const filters: ContactSubmissionFilters = {
    search: resolvedSearchParams.search,
    status: resolvedSearchParams.status,
    priority: resolvedSearchParams.priority,
    page: resolvedSearchParams.page
      ? parseInt(resolvedSearchParams.page)
      : 1,
    limit: 10,
  }

  const [{ submissions, total, page, totalPages }, stats] = await Promise.all([
    getContactSubmissions(filters),
    getContactStats(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Contact Submissions
        </h1>
        <p className="text-muted-foreground">
          Manage and respond to contact form inquiries
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New</CardTitle>
            <MessageSquarePlus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Replied</CardTitle>
            <MessageSquareReply className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.repliedCount}</div>
            <p className="text-xs text-muted-foreground">Responded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.archivedCount}</div>
            <p className="text-xs text-muted-foreground">Closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
          <CardDescription>
            View and manage contact form submissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ContactFilters />
          <ContactSubmissionsTable submissions={submissions} />
          {totalPages > 1 && (
            <div className="flex justify-center">
              <CustomPagination
                currentPage={page}
                totalPages={totalPages}
                baseUrl="/admin/contact"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
