import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Tag, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getLocationTypesAdmin, getLocationTypeStats } from './actions'
import { LocationTypesTable } from './components/location-types-table'

export const metadata: Metadata = {
  title: 'Location Types | Admin',
}

interface LocationTypesPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    page?: string
  }>
}

export default async function LocationTypesPage({ searchParams }: LocationTypesPageProps) {
  const params = await searchParams
  const filters = {
    search: params.search,
    status: params.status,
    page: params.page ? parseInt(params.page) : 1,
  }

  const [result, stats] = await Promise.all([
    getLocationTypesAdmin(filters),
    getLocationTypeStats(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Location Types</h1>
          <p className="text-muted-foreground">
            Manage location type categories for your service areas
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/location-types/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Type
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Types</CardTitle>
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
      </div>

      <LocationTypesTable locationTypes={result.locationTypes} pagination={result} />
    </div>
  )
}
