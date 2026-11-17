'use client'

import type { FleetGroup as FleetGroupModel } from './fleet-model'
import type { ResultsSearchParams } from './results-search-params'
import { VehicleFleetCard } from './vehicle-fleet-card'
import { PriceMeter } from './price-meter'
import { formatResultPrice } from './format-result-price'
import { useCurrency } from '@/lib/currency/context'

interface FleetGroupProps {
  group: FleetGroupModel
  searchParams: ResultsSearchParams
  /** Page position of this group's first card, so only the first row loads with priority. */
  startIndex: number
  /** Price level per category id, for the class pill on each card. */
  levels: Readonly<Record<string, number>>
}

/** One class: a header (name, price level, count, from-price) over its card grid. The flat list has no header. */
export function FleetGroup({ group, searchParams, startIndex, levels }: FleetGroupProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const count = group.vehicles.length
  const headingId = `fleet-group-${group.id}`

  return (
    <section className="fleet-group" aria-labelledby={group.name ? headingId : undefined}>
      {group.name && (
        <div className="fleet-group__head">
          <h3 id={headingId} className="fleet-group__title">{group.name}</h3>
          {group.level !== undefined && <PriceMeter level={group.level} />}
          <p className="fleet-group__meta numeric">
            {count} {count === 1 ? 'vehicle' : 'vehicles'}
            {' · '}
            {group.fromPrice === null
              ? 'unavailable on this trip'
              : `from ${formatResultPrice(group.fromPrice, currentCurrency, exchangeRates)}`}
          </p>
        </div>
      )}

      <div className="fleet-grid">
        {group.vehicles.map((vehicleType, i) => (
          <VehicleFleetCard
            key={vehicleType.id}
            vehicleType={vehicleType}
            searchParams={searchParams}
            index={startIndex + i}
            level={levels[vehicleType.categoryId]}
            headingLevel={group.name ? 'h4' : 'h3'}
          />
        ))}
      </div>
    </section>
  )
}
