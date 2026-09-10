import { getPopularRoutes } from '@/app/actions'
import { collapseCorridors } from '@/lib/routes/corridors'
import { DeparturePointsClient } from './departure-points-client'

/**
 * The old five-corridor cap was geometry, not editorial judgement: the grid ran
 * three-up and closed with an "All routes" tile, so five corridors plus that
 * tile filled 3x2 exactly instead of leaving a hole. A rail has no such shape to
 * fill, and the cap was quietly hiding corridors — the RPC returns ten rows,
 * which collapse to seven distinct journeys.
 *
 * The limit that remains is about the rail staying scannable rather than about
 * rows and columns. Collapsing still happens before the slice: doing it after
 * would let a reversible pair occupy two slots and then drop a distinct corridor
 * that would otherwise have made the cut.
 */
const MAX_CORRIDORS = 10

export async function DeparturePoints({ todayDate }: { todayDate: string }) {
  const routes = await getPopularRoutes()
  const collapsed = collapseCorridors(routes)
  const corridors = collapsed.slice(0, MAX_CORRIDORS)

  if (corridors.length === 0) {
    return null // Don't show section if no routes
  }

  // Pass data to Client Component for rendering with animations.
  // totalCorridors is the count before the slice, so the rail foot can say what
  // it is showing out of what exists rather than counting its own children.
  return (
    <DeparturePointsClient
      corridors={corridors}
      totalCorridors={collapsed.length}
      todayDate={todayDate}
    />
  )
}
