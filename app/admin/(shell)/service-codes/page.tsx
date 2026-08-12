import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Tag, CheckCircle, XCircle, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
        <div>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Types</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.serviceTypes.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <form className="flex gap-4 flex-1">
          <Input
            name="search"
            placeholder="Search codes..."
            defaultValue={params.search || ''}
            className="max-w-xs"
          />
          <Select name="serviceType" defaultValue={params.serviceType || 'all'}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Service Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
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

      <Suspense fallback={<div>Loading...</div>}>
        <ServiceCodesTable serviceCodes={result.serviceCodes} />
      </Suspense>

      {result.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((result.page - 1) * result.limit) + 1} to{' '}
            {Math.min(result.page * result.limit, result.total)} of {result.total} service codes
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={result.page === 1}
              asChild
            >
              <Link
                href={{
                  pathname: '/admin/service-codes',
                  query: { ...params, page: result.page - 1 },
                }}
              >
                Previous
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={result.page === result.totalPages}
              asChild
            >
              <Link
                href={{
                  pathname: '/admin/service-codes',
                  query: { ...params, page: result.page + 1 },
                }}
              >
                Next
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
