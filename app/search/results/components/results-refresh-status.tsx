'use client'

/**
 * What a Date or Guests change is doing, under the trip ledger.
 *
 * While the new search loads it names what is being loaded; once the results
 * are in it confirms them with the vehicle count, then clears. The confirmation
 * matters most when nothing visibly moves: a new date often returns the same
 * vehicles at the same fares, and without it the page gave no sign it had
 * searched at all.
 *
 * Absolutely positioned under the ledger so appearing and clearing never pushes
 * the page around. The live region itself stays mounted so screen readers
 * announce each change.
 */

import { Check, Loader2 } from 'lucide-react'
import { useSearchRefreshStatus } from './search-refresh-context'

interface ResultsRefreshStatusProps {
  /** Vehicles on the page now. Read at confirmation time, so it is the new count. */
  vehicleCount: number
}

export function ResultsRefreshStatus({ vehicleCount }: ResultsRefreshStatusProps) {
  const refresh = useSearchRefreshStatus()
  if (!refresh) return null

  const { isPending, pendingLabel, lastUpdate } = refresh
  const vehicles = `${vehicleCount} ${vehicleCount === 1 ? 'vehicle' : 'vehicles'}`

  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-x-0 top-full mt-3 flex items-center gap-2 text-[0.8125rem] text-[var(--text-secondary)]"
    >
      {isPending && pendingLabel ? (
        <>
          <Loader2
            className="h-3.5 w-3.5 flex-none animate-spin text-[var(--gold-text)] motion-reduce:animate-none"
            aria-hidden="true"
          />
          <span className="min-w-0 truncate">Updating vehicles for {pendingLabel}</span>
        </>
      ) : lastUpdate ? (
        <>
          <Check className="h-3.5 w-3.5 flex-none text-[var(--gold-text)]" aria-hidden="true" />
          <span className="min-w-0 truncate">
            Updated. {vehicles} for {lastUpdate.label}
          </span>
        </>
      ) : null}
    </div>
  )
}

interface ResultsRefreshRegionProps {
  children: React.ReactNode
}

/**
 * Dims the fleet while a new search loads. The grid is below the fold on most
 * screens, so it carries its own note rather than relying on the hero's.
 */
export function ResultsRefreshRegion({ children }: ResultsRefreshRegionProps) {
  const refresh = useSearchRefreshStatus()
  const isPending = refresh?.isPending ?? false

  return (
    <div aria-busy={isPending} className="relative">
      {isPending && (
        <p className="absolute -top-8 left-0 flex items-center gap-2 text-[0.8125rem] text-[var(--text-secondary)]">
          <Loader2
            className="h-3.5 w-3.5 flex-none animate-spin text-[var(--gold-text)] motion-reduce:animate-none"
            aria-hidden="true"
          />
          Updating vehicles
        </p>
      )}
      <div
        className={
          isPending
            ? 'pointer-events-none opacity-50 transition-opacity duration-200'
            : 'transition-opacity duration-200'
        }
      >
        {children}
      </div>
    </div>
  )
}
