import Link from 'next/link'
import { cn } from '@/lib/utils'
import { journeyTabs, type JourneyState } from '@/lib/trips/journey-tabs'
import type { AdminTripGroup } from '@/lib/trips/admin-types'

interface JourneySwitcherProps {
  group: AdminTripGroup
  currentBookingId: string
}

const STATE_DOT: Record<JourneyState, string> = {
  assigned: 'bg-emerald-500',
  unassigned: 'bg-red-500',
  cancelled: 'bg-muted-foreground',
}

const STATE_TEXT: Record<JourneyState, string> = {
  assigned: 'Vendor assigned',
  unassigned: 'No vendor',
  cancelled: 'Cancelled',
}

/**
 * Tabs across the journeys of a round trip or multi-city order. Each journey
 * is its own booking page, so a tab is a plain link; the filled tab is the one
 * every card below it acts on. Sticky so it stays in view while scrolling.
 */
export function JourneySwitcher({ group, currentBookingId }: JourneySwitcherProps) {
  const tabs = journeyTabs(group, currentBookingId)

  return (
    <nav
      aria-label="Journeys of this trip"
      className="sticky top-2 z-20 w-fit max-w-full"
    >
      <ol className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border bg-card p-1 text-muted-foreground shadow-sm">
        {tabs.map((tab) => (
          <li key={tab.id} className="shrink-0">
            <Link
              href={tab.href}
              aria-current={tab.current ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                tab.current
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-transparent hover:border-border hover:bg-primary/5 hover:text-foreground',
              )}
            >
              <span className={cn('h-2 w-2 shrink-0 rounded-full', STATE_DOT[tab.state])} aria-hidden />
              <span>{tab.label}</span>
              <span className="font-mono text-xs font-normal text-muted-foreground">{tab.reference}</span>
              <span className="sr-only">{STATE_TEXT[tab.state]}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}
