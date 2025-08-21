import { Metadata } from 'next'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AdminLayout } from '@/components/layout/admin-layout'
import { ZonesTable } from './components/zones-table'
import { getZones } from './actions'

export const metadata: Metadata = {
  title: 'Zones | Admin',
  description: 'Manage pricing zones',
}

export default async function ZonesPage() {
  const zones = await getZones()

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Zones</h1>
            <p className="text-muted-foreground">
              Manage pricing zones for location-based fare calculation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/zones/pricing">
              <Button variant="outline">
                Pricing Matrix
              </Button>
            </Link>
            <Link href="/admin/zones/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Zone
              </Button>
            </Link>
          </div>
        </div>

        <ZonesTable zones={zones} />
      </div>
    </AdminLayout>
  )
}