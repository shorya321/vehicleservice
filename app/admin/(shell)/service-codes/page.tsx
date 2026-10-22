import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Tag, CheckCircle, XCircle, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getServiceCodes, getServiceCodeStats } from './actions'
import { ServiceCodesTable } from './components/service-codes-table'
import { PagePagination } from '@/components/admin/ui/page-pagination'
import { FilterToggle } from '@/components/admin/ui/filter-toggle'
import { StatCard } from '@/components/admin/ui/stat-card'

export const metadata: Metadata = {
  title: 'Service Codes | Admin',
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    serviceType?: string
    page?: string
  }>
}

export default async function ServiceCodesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)

  // Filters the URL sets on top of the defaults; opens the filter panel when above 0.
  const activeFilterCount = [
    params.search,
    params.serviceType && params.serviceType !== 'all',
  ].filter(Boolean).length

  const [result, stats] = await Promise.all([
    getServiceCodes({
      search: params.search,
      serviceType: params.serviceType,
      page,
    }),
    getServiceCodeStats(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Service Codes</h1>
          <p className="text-muted-foreground">
            Manage trip number service codes
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/service-codes/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Code
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Total Codes"
          value={stats.total}
          hint="All service codes"
          icon={Tag}
          tone={{ disc: 'bg-primary/20', icon: 'text-primary', value: 'text-sky-700 dark:text-sky-400' }}
          delay={0.1}
        />
        <StatCard
          label="Active"
          value={stats.active}
          hint="Enabled codes"
          icon={CheckCircle}
          tone={{ disc: 'bg-emerald-500/20', icon: 'text-emerald-500', value: 'text-emerald-700 dark:text-emerald-400' }}
          delay={0.2}
        />
        <StatCard
          label="Inactive"
          value={stats.inactive}
          hint="Disabled codes"
          icon={XCircle}
          tone={{ disc: 'bg-red-500/20', icon: 'text-red-500', value: 'text-red-700 dark:text-red-400' }}
          delay={0.3}
        />
        <StatCard
          label="Service Types"
          value={stats.serviceTypes.length}
          hint="Distinct types in use"
          icon={Layers}
          tone={{ disc: 'bg-amber-500/20', icon: 'text-amber-500', value: 'text-amber-700 dark:text-amber-400' }}
          delay={0.4}
        />
      </div>

      <Card>
        <CardHeader>
          <FilterToggle
            activeCount={activeFilterCount}
            header={
              <div className="space-y-1.5">
                <CardTitle>All Service Codes</CardTitle>
                <CardDescription>View and manage trip number service codes</CardDescription>
              </div>
            }
          >
            <div className="flex gap-4">
              <form className="flex gap-4 flex-1">
                <Input aria-label="Search codes"
                  name="search"
                  placeholder="Search codes..."
                  defaultValue={params.search || ''}
                  className="max-w-xs"
                />
                <Select name="serviceType" defaultValue={params.serviceType || 'all'}>
                  <SelectTrigger aria-label="Filter by service type" className="w-[180px]">
                    <SelectValue placeholder="Service Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="yacht">Yacht</SelectItem>
                    <SelectItem value="jet">Jet</SelectItem>
                    <SelectItem value="desert">Desert</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" variant="secondary">
                  Filter
                </Button>
              </form>
            </div>
          </FilterToggle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Suspense fallback={<div>Loading...</div>}>
            <ServiceCodesTable serviceCodes={result.serviceCodes} />
          </Suspense>

          <PagePagination pathname="/admin/service-codes" page={result.page} totalPages={result.totalPages} total={result.total} limit={result.limit} noun="service codes" query={params} />
        </CardContent>
      </Card>
    </div>
  )
}
