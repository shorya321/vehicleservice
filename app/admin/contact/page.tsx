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
import { AnimatedCard } from '@/components/ui/animated-card'

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
        <AnimatedCard delay={0.1}>
          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Total</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">{stats.total}</span>
              </div>
              <p className="text-xs text-muted-foreground">All submissions</p>
            </CardContent>
          </Card>
        </AnimatedCard>
        <AnimatedCard delay={0.2}>
          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">New</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/20">
                  <MessageSquarePlus className="h-4 w-4 text-sky-500" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">{stats.newCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>
        </AnimatedCard>
        <AnimatedCard delay={0.3}>
          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Replied</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
                  <MessageSquareReply className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">{stats.repliedCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Responded</p>
            </CardContent>
          </Card>
        </AnimatedCard>
        <AnimatedCard delay={0.4}>
          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Archived</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20">
                  <Archive className="h-4 w-4 text-amber-500" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-violet-400">{stats.archivedCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Closed</p>
            </CardContent>
          </Card>
        </AnimatedCard>
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
