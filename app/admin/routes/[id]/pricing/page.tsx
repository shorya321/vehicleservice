import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AdminLayout } from '@/components/layout/admin-layout'
import { requireAdmin } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Route, DollarSign } from 'lucide-react'
import { getRoutePricing } from './actions'
import { PricingTable } from './components/pricing-table'

export const metadata: Metadata = {
  title: 'Route Pricing Management - Admin Portal',
  description: 'Manage vehicle type pricing for routes',
}

interface RoutePricingPageProps {
  params: Promise<{ id: string }>
}

export default async function RoutePricingPage({ params }: RoutePricingPageProps) {
  await requireAdmin()
  
  const { id } = await params
  const pricingData = await getRoutePricing(id)
  
  if (!pricingData) {
    notFound()
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/routes">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Route Pricing</h1>
              <p className="text-muted-foreground">
                Manage pricing for {pricingData.route.route_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/admin/routes/${id}/edit`}>
              <Button variant="outline">
                <Route className="h-4 w-4 mr-2" />
                Edit Route
              </Button>
            </Link>
          </div>
        </div>

        {/* Route Info Card */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Route className="h-4 w-4" />
                Route Details
              </div>
              <p className="font-medium">
                {pricingData.route.origin.name} → {pricingData.route.destination.name}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Base Price
              </div>
              <p className="font-medium text-lg">
                ${pricingData.route.base_price}
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Table */}
        <PricingTable
          routeId={id}
          routeName={pricingData.route.route_name}
          initialPricing={pricingData.pricing}
        />
      </div>
    </AdminLayout>
  )
}