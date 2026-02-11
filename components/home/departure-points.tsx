import { getPopularRoutes } from '@/app/actions'
import { DeparturePointsClient } from './departure-points-client'

export async function DeparturePoints({ todayDate }: { todayDate: string }) {
  // Fetch popular routes from database (Server Component)
  const routes = await getPopularRoutes()

  // Only show top 6 routes
  const displayedRoutes = routes.slice(0, 6)

  if (displayedRoutes.length === 0) {
    return null // Don't show section if no routes
  }

  // Pass data to Client Component for rendering with animations
  return <DeparturePointsClient routes={displayedRoutes} totalRoutes={routes.length} todayDate={todayDate} />
}
