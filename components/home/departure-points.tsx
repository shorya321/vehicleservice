import { getPopularRoutes } from '@/app/actions'
import { collapseCorridors } from '@/lib/routes/corridors'
import { DeparturePointsClient } from './departure-points-client'

/**
 * Five, not six: the grid runs three-up and closes with an "All routes" tile,
 * so five corridors plus that tile fill 3x2 exactly instead of leaving a hole.
 *
 * Collapsing happens before the slice. Doing it after would let a reversible
 * pair occupy two of the five slots and then drop a distinct corridor that
 * would otherwise have made the cut.
 */
const MAX_CORRIDORS = 5

export async function DeparturePoints({ todayDate }: { todayDate: string }) {
  const routes = await getPopularRoutes()
  const corridors = collapseCorridors(routes).slice(0, MAX_CORRIDORS)

  if (corridors.length === 0) {
    return null // Don't show section if no routes
  }

  // Pass data to Client Component for rendering with animations
  return <DeparturePointsClient corridors={corridors} todayDate={todayDate} />
}
