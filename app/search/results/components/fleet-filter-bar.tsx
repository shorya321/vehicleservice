'use client'

import { Briefcase, Users } from 'lucide-react'
import { SortSelect } from './sort-select'
import { FLEET_SORTS, FLEET_SORT_LABELS, type FleetNeed, type FleetSort } from './fleet-model'

interface FleetFilterBarProps {
  needs: readonly FleetNeed[]
  activeNeedId: string | null
  onNeedChange: (id: string | null) => void
  sort: FleetSort
  onSortChange: (sort: FleetSort) => void
}

/**
 * Quick filters on the left, sort on the right. The chips come from
 * fleet-model's needChips, so each one narrows the list without emptying it;
 * with none to offer, the bar is just the sort.
 */
export function FleetFilterBar({ needs, activeNeedId, onNeedChange, sort, onSortChange }: FleetFilterBarProps) {
  return (
    <div className="results-bar">
      {needs.length > 0 && (
        <div role="group" aria-label="Filter by passengers and bags" className="results-bar__chips scrollbar-hide">
          <span className="results-bar__label" aria-hidden="true">Need</span>
          {needs.map((need) => {
            const pressed = need.id === activeNeedId
            const Icon = need.kind === 'passengers' ? Users : Briefcase
            return (
              <button
                key={need.id}
                type="button"
                aria-pressed={pressed}
                onClick={() => onNeedChange(pressed ? null : need.id)}
                className="results-chip"
              >
                <Icon aria-hidden="true" />
                {need.label}
              </button>
            )
          })}
        </div>
      )}

      <div className="results-bar__sort">
        <span className="results-bar__label" aria-hidden="true">Sort</span>
        <SortSelect<FleetSort>
          value={sort}
          options={FLEET_SORTS}
          labels={FLEET_SORT_LABELS}
          onChange={onSortChange}
          label="Sort"
          shape="pill"
        />
      </div>
    </div>
  )
}
