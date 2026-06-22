import { Metadata } from 'next'
import { Plus, Map } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatedCard } from '@/components/ui/animated-card'
import { AnimatedPage } from '@/components/layout/animated-page'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { ZonesTable } from './components/zones-table'
import { getZones } from './actions'

export const metadata: Metadata = {
  title: 'Zones | Admin',
  description: 'Manage pricing zones',
}

interface ZonesPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    page?: string
  }>
}

export default async function ZonesPage({ searchParams }: ZonesPageProps) {
  const params = await searchParams
  const filters = {
    search: params.search,
    status: params.status,
    page: params.page ? parseInt(params.page) : 1,
  }

  const zonesData = await getZones(filters)

  return (
      <AnimatedPage>
        <Breadcrumb items={[{ label: 'Zones', href: '/admin/zones' }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Zones</h1>
            <p className="text-muted-foreground">
              Manage pricing zones for location-based fare calculation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/zones/pricing">
                Pricing Matrix
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/zones/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Zone
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <AnimatedCard delay={0.1}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Total Zones</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                    <Map className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">{zonesData.total}</span>
                </div>
                <p className="text-xs text-muted-foreground">All zones</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>

        <ZonesTable zones={zonesData.zones} pagination={zonesData} />
      </AnimatedPage>
  )
}