'use client'

import { Baby, Briefcase, Coffee, LucideIcon, PawPrint, Package, Target, Wifi } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatChildAges } from '@/lib/utils/child-ages'
import type { VendorBookingAddon } from '@/lib/vendor/bookings/types'

/**
 * `addons.icon` stores a Lucide component name. Only the ones actually in the catalogue are
 * mapped; anything new falls back to a generic box rather than rendering nothing.
 */
const ICONS: Record<string, LucideIcon> = {
  Baby,
  Briefcase,
  Coffee,
  PawPrint,
  Target,
  Wifi,
}

/**
 * Child safety leads. A missing seat is the one requirement that turns a driver away at the
 * kerb, so it must not sit below the golf clubs.
 */
const CATEGORY_ORDER = ['Child Safety', 'Luggage', 'Comfort']

function categoryRank(category: string | null): number {
  const index = CATEGORY_ORDER.indexOf(category || '')
  return index === -1 ? CATEGORY_ORDER.length : index
}

interface ServiceRequirementsProps {
  addons: VendorBookingAddon[]
}

/**
 * What has to be in the car.
 *
 * The admin page renders these as price lines inside its payment card. For a vendor they are
 * the job specification, not a bill, so they get their own card and no prices.
 */
export function ServiceRequirements({ addons }: ServiceRequirementsProps) {
  const groups = new Map<string, VendorBookingAddon[]>()
  for (const addon of addons) {
    const key = addon.category || 'Other'
    groups.set(key, [...(groups.get(key) || []), addon])
  }

  // Array.from, not a spread: the compile target is ES5, where spreading a Map iterator needs
  // downlevelIteration and otherwise fails to build.
  const ordered: Array<[string, VendorBookingAddon[]]> = Array.from(groups.entries()).sort(
    ([a], [b]) => categoryRank(a === 'Other' ? null : a) - categoryRank(b === 'Other' ? null : b)
  )

  const childSeatCount = addons
    .filter((addon) => addon.category === 'Child Safety')
    .reduce((sum, addon) => sum + addon.quantity, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Requirements</CardTitle>
        <CardDescription>
          {childSeatCount > 0
            ? `Includes ${childSeatCount} child ${childSeatCount === 1 ? 'seat' : 'seats'} the driver must carry`
            : 'Extras requested with this booking'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {addons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No extra services requested.</p>
        ) : (
          <div className="space-y-5">
            {ordered.map(([category, items]) => {
              const isChildSafety = category === 'Child Safety'
              return (
                <div key={category} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {category}
                  </p>
                  <div className="space-y-2">
                    {items.map((addon) => {
                      const Icon = (addon.icon && ICONS[addon.icon]) || Package
                      return (
                        <div
                          key={addon.id}
                          className={`flex items-center gap-3 rounded-lg border p-3 ${
                            isChildSafety ? 'border-amber-500/40 bg-amber-500/5' : ''
                          }`}
                        >
                          <div
                            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                              isChildSafety ? 'bg-amber-500/20' : 'bg-muted'
                            }`}
                          >
                            <Icon
                              className={`h-4 w-4 ${
                                isChildSafety ? 'text-amber-500' : 'text-muted-foreground'
                              }`}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                              {addon.name}
                              <span className="text-muted-foreground">
                                {formatChildAges(addon.childAges)}
                              </span>
                            </p>
                          </div>
                          {addon.quantity > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              x{addon.quantity}
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
