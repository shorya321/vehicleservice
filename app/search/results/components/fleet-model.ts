import type { VehicleTypeResult, VehicleTypesByCategory } from '../actions'

/**
 * The rules behind the search fleet: which vehicles show, in what order, under
 * which class header, and which quick filters are worth offering. Pure on
 * purpose, so tests/search/fleet-model.test.ts can pin every one of them and
 * the components stay a thin rendering layer.
 */

export type FleetSort = 'price-asc' | 'price-desc' | 'capacity' | 'name'

export const FLEET_SORTS = ['price-asc', 'price-desc', 'capacity', 'name'] as const satisfies readonly FleetSort[]

export const FLEET_SORT_LABELS: Record<FleetSort, string> = {
  'price-asc': 'Price · low to high',
  'price-desc': 'Price · high to low',
  capacity: 'Capacity',
  name: 'Name',
}

/** Grouping by class only reads true on the default sort; any other sort is a flat ranking. */
export const DEFAULT_FLEET_SORT: FleetSort = 'price-asc'

export function isBookable(vehicle: VehicleTypeResult): boolean {
  return vehicle.availableVehicles > 0
}

const COMPARE: Record<FleetSort, (a: VehicleTypeResult, b: VehicleTypeResult) => number> = {
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  capacity: (a, b) => b.capacity - a.capacity,
  name: (a, b) => a.name.localeCompare(b.name),
}

/** The chosen order, then every unbookable vehicle after the bookable ones. Returns a new array. */
export function sortVehicles(list: readonly VehicleTypeResult[], sort: FleetSort): VehicleTypeResult[] {
  return [...list]
    .sort(COMPARE[sort])
    .sort((a, b) => Number(!isBookable(a)) - Number(!isBookable(b)))
}

/** Lowest bookable fare. Null when nothing can be booked, so no header quotes a sold-out price. */
export function fromPrice(list: readonly VehicleTypeResult[]): number | null {
  const prices = list.filter(isBookable).map((v) => v.price)
  return prices.length > 0 ? Math.min(...prices) : null
}

/**
 * A 1 to 5 price level per class, ranked by each class's from-price. Ties
 * share a level. A single class gets nothing: a meter with one reading says
 * nothing. A class with nothing bookable has no price, so no level.
 */
export function classLevels(categories: readonly VehicleTypesByCategory[]): Record<string, number> {
  const priced = categories
    .map((c) => ({ id: c.categoryId, price: fromPrice(c.vehicleTypes) }))
    .filter((c): c is { id: string; price: number } => c.price !== null)
  const distinct = Array.from(new Set(priced.map((c) => c.price))).sort((a, b) => a - b)
  if (priced.length < 2 || distinct.length < 2) return {}

  const steps = distinct.length - 1
  return Object.fromEntries(
    priced.map((c) => [c.id, 1 + Math.round((distinct.indexOf(c.price) * 4) / steps)])
  )
}

export interface FleetNeed {
  id: string
  label: string
  kind: 'passengers' | 'bags'
  min: number
}

const NEED_CANDIDATES: readonly FleetNeed[] = [
  { id: 'passengers-4', label: '4+ passengers', kind: 'passengers', min: 4 },
  { id: 'passengers-6', label: '6+ passengers', kind: 'passengers', min: 6 },
  { id: 'passengers-8', label: '8+ passengers', kind: 'passengers', min: 8 },
  { id: 'passengers-12', label: '12+ passengers', kind: 'passengers', min: 12 },
  { id: 'bags-3', label: '3+ bags', kind: 'bags', min: 3 },
  { id: 'bags-5', label: '5+ bags', kind: 'bags', min: 5 },
]

export function matchesNeed(vehicle: VehicleTypeResult, need: FleetNeed): boolean {
  const value = need.kind === 'passengers' ? vehicle.capacity : vehicle.luggageCapacity
  return value >= need.min
}

/**
 * Only filters that narrow the list without emptying it: a chip never does
 * nothing and never leads to a blank page. Chips of one kind that keep exactly
 * the same vehicles are duplicates; the highest threshold is kept, because
 * "6+ passengers" says more than "4+" about a list where everything seats six.
 */
export function needChips(list: readonly VehicleTypeResult[]): FleetNeed[] {
  const seen = new Set<string>()
  const kept = [...NEED_CANDIDATES].reverse().filter((need) => {
    const matches = list.filter((v) => matchesNeed(v, need))
    // A chip must keep something bookable: one whose only matches are sold out leads to a page of grey cards.
    if (!matches.some(isBookable) || matches.length === list.length) return false
    const signature = `${need.kind}:${matches.map((v) => v.id).join(',')}`
    if (seen.has(signature)) return false
    seen.add(signature)
    return true
  })
  return kept.reverse()
}

export interface FleetGroup {
  id: string
  /** Null for the flat list of a non-default sort, which has no header. */
  name: string | null
  vehicles: VehicleTypeResult[]
  fromPrice: number | null
  level: number | undefined
}

export interface FleetSelection {
  byCategory: readonly VehicleTypesByCategory[]
  all: readonly VehicleTypeResult[]
  categoryId: string | null
  needId: string | null
  sort: FleetSort
}

const OTHER_GROUP_ID = '__other'

/** The class the strip points at, or null for All. An id that no longer exists falls back to All. */
export function resolveCategory(
  byCategory: readonly VehicleTypesByCategory[],
  categoryId: string | null
): VehicleTypesByCategory | null {
  return categoryId ? byCategory.find((c) => c.categoryId === categoryId) ?? null : null
}

/** The vehicles the strip selects, before any quick filter. */
export function vehiclesInScope(selection: Pick<FleetSelection, 'byCategory' | 'all' | 'categoryId'>): VehicleTypeResult[] {
  const category = resolveCategory(selection.byCategory, selection.categoryId)
  return category ? [...category.vehicleTypes] : [...selection.all]
}

/** The quick filter in force: a stale id the current scope no longer offers is ignored. */
export function activeNeed(scope: readonly VehicleTypeResult[], needId: string | null): FleetNeed | null {
  if (!needId) return null
  return needChips(scope).find((n) => n.id === needId) ?? null
}

export function buildFleetGroups(selection: FleetSelection): FleetGroup[] {
  const scope = vehiclesInScope(selection)
  const need = activeNeed(scope, selection.needId)
  const visible = need ? scope.filter((v) => matchesNeed(v, need)) : scope
  if (visible.length === 0) return []

  if (selection.sort !== DEFAULT_FLEET_SORT) {
    const vehicles = sortVehicles(visible, selection.sort)
    return [{ id: 'all', name: null, vehicles, fromPrice: fromPrice(vehicles), level: undefined }]
  }

  const levels = classLevels(selection.byCategory)
  const visibleIds = new Set(visible.map((v) => v.id))

  const classGroups: FleetGroup[] = selection.byCategory.flatMap((category) => {
    const vehicles = sortVehicles(category.vehicleTypes.filter((v) => visibleIds.has(v.id)), selection.sort)
    if (vehicles.length === 0) return []
    return [{
      id: category.categoryId,
      name: category.categoryName,
      vehicles,
      fromPrice: fromPrice(vehicles),
      level: levels[category.categoryId],
    }]
  })

  // Cheapest class first, so the default "Price · low to high" still reads low to high.
  // A class with nothing bookable has no price and goes after every bookable class.
  // The sort is stable, so ties keep the server's class order.
  const ordered = [...classGroups].sort((a, b) => {
    if (a.fromPrice === null || b.fromPrice === null) return Number(a.fromPrice === null) - Number(b.fromPrice === null)
    return a.fromPrice - b.fromPrice
  })

  // A vehicle with no category group must still show; it never silently drops off the page.
  const grouped = new Set(classGroups.flatMap((g) => g.vehicles.map((v) => v.id)))
  const stray = sortVehicles(visible.filter((v) => !grouped.has(v.id)), selection.sort)
  if (stray.length === 0) return ordered
  return [...ordered, { id: OTHER_GROUP_ID, name: 'Other vehicles', vehicles: stray, fromPrice: fromPrice(stray), level: undefined }]
}
