'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import type { VehicleTypeResult, VehicleTypesByCategory } from '../actions'
import type { ResultsSearchParams } from './results-search-params'
import {
  DEFAULT_FLEET_SORT,
  activeNeed,
  buildFleetGroups,
  classLevels,
  fromPrice,
  needChips,
  resolveCategory,
  vehiclesInScope,
  type FleetSort,
} from './fleet-model'
import { FleetClassStrip, type FleetClassTile } from './fleet-class-strip'
import { FleetFilterBar } from './fleet-filter-bar'
import { FleetGroup } from './fleet-group'

interface FleetBrowserProps {
  vehicleTypesByCategory: VehicleTypesByCategory[]
  allVehicleTypes: VehicleTypeResult[]
  searchParams: ResultsSearchParams
}

/**
 * The fleet on every results page (transfer, round trip, hourly, multi-city).
 * Same props as the category tabs it replaces. Each page remounts it with a
 * `key` when the search changes, so class, filter and sort start fresh on a
 * new date, party or package.
 */
export function FleetBrowser({ vehicleTypesByCategory, allVehicleTypes, searchParams }: FleetBrowserProps) {
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [needId, setNeedId] = useState<string | null>(null)
  const [sort, setSort] = useState<FleetSort>(DEFAULT_FLEET_SORT)

  // An id from a previous render that no longer exists reads as All.
  const activeCategoryId = resolveCategory(vehicleTypesByCategory, categoryId)?.categoryId ?? null

  const tiles = useMemo<FleetClassTile[]>(() => [
    { id: null, name: 'All', count: allVehicleTypes.length, fromPrice: fromPrice(allVehicleTypes) },
    ...vehicleTypesByCategory.map((c) => ({
      id: c.categoryId,
      name: c.categoryName,
      count: c.vehicleTypes.length,
      fromPrice: fromPrice(c.vehicleTypes),
    })),
  ], [allVehicleTypes, vehicleTypesByCategory])

  const scope = useMemo(
    () => vehiclesInScope({ byCategory: vehicleTypesByCategory, all: allVehicleTypes, categoryId: activeCategoryId }),
    [vehicleTypesByCategory, allVehicleTypes, activeCategoryId]
  )
  const needs = useMemo(() => needChips(scope), [scope])
  const activeNeedId = activeNeed(scope, needId)?.id ?? null

  const levels = useMemo(() => classLevels(vehicleTypesByCategory), [vehicleTypesByCategory])
  const groups = useMemo(
    () => buildFleetGroups({ byCategory: vehicleTypesByCategory, all: allVehicleTypes, categoryId: activeCategoryId, needId: activeNeedId, sort }),
    [vehicleTypesByCategory, allVehicleTypes, activeCategoryId, activeNeedId, sort]
  )
  // Page position of each group's first card, so priority loading covers only the first row.
  const startIndexes = useMemo(
    () => groups.map((_, i) => groups.slice(0, i).reduce((total, g) => total + g.vehicles.length, 0)),
    [groups]
  )
  const shown = groups.reduce((total, g) => total + g.vehicles.length, 0)
  const filtered = activeCategoryId !== null || activeNeedId !== null

  // A quick filter the new class does not offer is dropped, not parked: it must
  // not silently switch back on when the reader returns to a class that has it.
  const selectCategory = useCallback((id: string | null) => {
    setCategoryId(id)
    setNeedId((current) => {
      const nextScope = vehiclesInScope({ byCategory: vehicleTypesByCategory, all: allVehicleTypes, categoryId: id })
      return activeNeed(nextScope, current)?.id ?? null
    })
  }, [vehicleTypesByCategory, allVehicleTypes])

  // The Clear button unmounts once nothing is filtered, so focus moves to the
  // count (which announces the new total) instead of falling back to <body>.
  const countRef = useRef<HTMLDivElement>(null)
  const clearFilters = useCallback(() => {
    setCategoryId(null)
    setNeedId(null)
    countRef.current?.focus()
  }, [])

  // Only one class: the strip would be "All" and that class, the same list twice.
  const showStrip = vehicleTypesByCategory.length > 1
  // A single vehicle has nothing to filter or sort.
  const showBar = allVehicleTypes.length > 1

  return (
    <div className="w-full">
      {showStrip && <FleetClassStrip tiles={tiles} activeId={activeCategoryId} onSelect={selectCategory} />}

      {showBar && (
        <FleetFilterBar
          needs={needs}
          activeNeedId={activeNeedId}
          onNeedChange={setNeedId}
          sort={sort}
          onSortChange={setSort}
        />
      )}

      <div ref={countRef} tabIndex={-1} className="results-count" aria-live="polite">
        <p className="numeric">
          <b>{shown} {shown === 1 ? 'vehicle' : 'vehicles'}</b>
          {filtered && <span> of {allVehicleTypes.length}</span>}
        </p>
        {filtered && (
          <button type="button" className="results-clear" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="results-empty">
          <p>No vehicle on this trip matches that.</p>
          <button type="button" className="results-clear" onClick={clearFilters}>
            Show all {allVehicleTypes.length}
          </button>
        </div>
      ) : (
        <div className="results-groups">
          {groups.map((group, i) => (
            <FleetGroup
              key={group.id}
              group={group}
              searchParams={searchParams}
              startIndex={startIndexes[i]}
              levels={levels}
            />
          ))}
        </div>
      )}
    </div>
  )
}
