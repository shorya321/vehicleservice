import { Suspense } from "react"
import { VendorApplicationsTable } from "./components/vendor-applications-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getVendorApplicationsStats } from "./actions"
import { Building2, Clock, CheckCircle2, XCircle, Eye, AlertCircle } from "lucide-react"
import { AnimatedCard } from "@/components/ui/animated-card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export const metadata = {
  title: "Vendor Applications | Admin",
  description: "Review and manage vendor applications",
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    page?: string
  }>
}

export default async function VendorApplicationsPage({ searchParams }: PageProps) {
  const params = await searchParams
  
  // Get statistics with error handling
  let stats = { total: 0, pending: 0, approved: 0, rejected: 0 }
  let statsError = null
  
  try {
    stats = await getVendorApplicationsStats()
  } catch (error) {
    console.error('Failed to load vendor application stats:', error)
    statsError = 'Failed to load statistics'
  }
  
  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              Vendor Applications
            </h1>
            <p className="text-muted-foreground">
              Review and manage vendor applications for your platform
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/vendor-applications">
              <Eye className="mr-2 h-4 w-4" />
              View All
            </Link>
          </Button>
        </div>

        {/* Error Alert */}
        {statsError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {statsError}. Please refresh the page to try again.
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <AnimatedCard delay={0.1}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Total Applications</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">{stats.total}</span>
                </div>
                <p className="text-xs text-muted-foreground">All time applications</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.2}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Pending Review</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20">
                    <Clock className="h-4 w-4 text-amber-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">{stats.pending}</span>
                </div>
                <p className="text-xs text-muted-foreground">Awaiting admin action</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.3}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Approved</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">{stats.approved}</span>
                </div>
                <p className="text-xs text-muted-foreground">Active vendors</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.4}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Rejected</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20">
                    <XCircle className="h-4 w-4 text-red-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-red-400">{stats.rejected}</span>
                </div>
                <p className="text-xs text-muted-foreground">Declined applications</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Applications</CardTitle>
            <CardDescription>
              Review vendor applications and approve or reject them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<TableSkeleton />}>
              <VendorApplicationsTable
                search={params.search}
                status={params.status}
                page={params.page ? parseInt(params.page) : 1}
              />
            </Suspense>
          </CardContent>
        </Card>
      </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-10 w-[150px]" />
      </div>
      <div className="border rounded-lg">
        <div className="h-[400px] flex items-center justify-center">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[100px]" />
        <Skeleton className="h-8 w-[200px]" />
      </div>
    </div>
  )
}