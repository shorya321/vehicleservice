import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PricingMatrix } from '../components/pricing-matrix'
import { getZones, getZonePricing } from '../actions'

export const metadata: Metadata = {
  title: 'Zone Pricing Matrix | Admin',
  description: 'Manage pricing between zones',
}

export default async function ZonePricingPage() {
  const [zones, pricing] = await Promise.all([
    getZones(),
    getZonePricing()
  ])

  // Create a map for quick pricing lookup - use | as separator to avoid conflicts with UUID hyphens
  const pricingMap = new Map(
    pricing.map(p => [`${p.from_zone_id}|${p.to_zone_id}`, p.base_price])
  )

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/zones">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Zone Pricing Matrix</h1>
            <p className="text-muted-foreground">
              Set base prices for transfers between zones
            </p>
          </div>
        </div>

        <PricingMatrix zones={zones} pricingMap={pricingMap} />
      </div>
  )
}