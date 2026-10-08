'use client'

/**
 * One navigation state for every control that re-runs the results query.
 *
 * Date and Guests each used to own a private `useTransition`, so the only sign
 * of a change was its own trigger fading while it still showed the old value.
 * The fleet grid, below the fold on most screens, gave no sign at all, and
 * nothing said when the new results had landed. Since a changed date often
 * returns the same vehicles at the same fares, users could not tell whether
 * anything had happened.
 *
 * The provider holds the transition so the hero status line and the grid can
 * show the same pending state, and records what was asked for so the status
 * line can confirm it once the new results are committed.
 *
 * Outside a provider (hourly, multi-city, empty state) each picker falls back
 * to a transition of its own, which is how they behaved before.
 */

import { createContext, useCallback, useContext, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, parse } from 'date-fns'
import { formatGuestSummary, type GuestBreakdown } from '@/components/home/hero/guest-breakdown'

/** How long the "Updated" confirmation stays up. */
const CONFIRMATION_MS = 4000

export interface SearchRefreshUpdate {
  label: string
  /** Increments per update, so a repeat of the same label still restarts the timer. */
  id: number
}

export interface SearchRefresh {
  isPending: boolean
  /** What is being loaded, e.g. "Sat 10 Oct, 2 adults". Null when idle. */
  pendingLabel: string | null
  /** The last completed change, cleared after a few seconds. */
  lastUpdate: SearchRefreshUpdate | null
  /**
   * Navigates inside the shared transition. `onStart` runs inside it, which is
   * where a picker sets its optimistic value.
   */
  navigate: (url: string, label: string, onStart?: () => void) => void
}

const SearchRefreshContext = createContext<SearchRefresh | null>(null)

function useSearchRefreshState(): SearchRefresh {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingLabel, setPendingLabel] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<SearchRefreshUpdate | null>(null)
  const [wasPending, setWasPending] = useState(false)

  // The transition settles in the same commit as the new results, so this is
  // the moment to confirm. Adjusted during render rather than in an effect, so
  // the confirmation paints together with the results it describes.
  if (wasPending !== isPending) {
    setWasPending(isPending)
    if (!isPending && pendingLabel) {
      setLastUpdate({ label: pendingLabel, id: (lastUpdate?.id ?? 0) + 1 })
      setPendingLabel(null)
    }
  }

  useEffect(() => {
    if (!lastUpdate) return
    const timer = setTimeout(() => setLastUpdate(null), CONFIRMATION_MS)
    return () => clearTimeout(timer)
  }, [lastUpdate])

  const navigate = useCallback(
    (url: string, label: string, onStart?: () => void) => {
      setPendingLabel(label)
      setLastUpdate(null)
      startTransition(() => {
        onStart?.()
        router.push(url)
      })
    },
    [router]
  )

  return { isPending, pendingLabel, lastUpdate, navigate }
}

export function SearchRefreshProvider({ children }: { children: React.ReactNode }) {
  const value = useSearchRefreshState()
  return <SearchRefreshContext.Provider value={value}>{children}</SearchRefreshContext.Provider>
}

/** The shared state inside a provider, or a private one outside it. */
export function useSearchRefresh(): SearchRefresh {
  const shared = useContext(SearchRefreshContext)
  const local = useSearchRefreshState()
  return shared ?? local
}

/** Shared state only. Null outside a provider, where there is nothing to show. */
export function useSearchRefreshStatus(): SearchRefresh | null {
  return useContext(SearchRefreshContext)
}

/** `yyyy-MM-dd` as "Sat 10 Oct". Parsed and formatted local, like the pickers. */
function shortDate(date: string | undefined): string | null {
  if (!date) return null
  const parsed = parse(date, 'yyyy-MM-dd', new Date())
  return Number.isNaN(parsed.getTime()) ? null : format(parsed, 'EEE d MMM')
}

/** "Sat 10 Oct, 2 adults, 1 child", or "Sat 10 Oct to Mon 12 Oct, 2 adults" for a round trip. */
export function describeSearch(
  date: string | undefined,
  guests: GuestBreakdown,
  returnDate?: string
): string {
  const summary = formatGuestSummary(guests)
  const outbound = shortDate(date)
  const inbound = shortDate(returnDate)
  if (!outbound) return summary
  return inbound ? `${outbound} to ${inbound}, ${summary}` : `${outbound}, ${summary}`
}
