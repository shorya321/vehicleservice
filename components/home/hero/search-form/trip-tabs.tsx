"use client"
import * as React from 'react'
import type { KeyboardEvent } from 'react'
import { ArrowLeftRight, Clock, MoveRight, Route, type LucideIcon } from 'lucide-react'
import { TRIP_TYPE_LABELS } from '@/lib/trips/constants'
import type { TripType } from '@/lib/trips/types'

/** Each icon draws the shape of the trip. Decorative: the label names the tab. */
export const TRIP_TAB_ICONS: Record<TripType, LucideIcon> = {
  one_way: MoveRight,
  round_trip: ArrowLeftRight,
  multi_city: Route,
  hourly: Clock,
}

interface TripTabsProps {
  tabs: TripType[]
  value: TripType
  onChange: (value: TripType) => void
}

/**
 * Trip-type switch above the hero bar. It sits outside the bar's grid on
 * purpose: the bar's borders and corner radii are keyed to child position, and
 * a row inside it would shift every one of them.
 */
export function TripTabs({ tabs, value, onChange }: TripTabsProps) {
  if (tabs.length < 2) return null

  // Arrow keys move between tabs, as a tablist should.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const index = tabs.indexOf(value)
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length
    onChange(tabs[next])
    const button = event.currentTarget.querySelector<HTMLButtonElement>(`[data-trip="${tabs[next]}"]`)
    button?.focus()
  }

  return (
    <div role="tablist" aria-label="Trip type" className="search-tabs" onKeyDown={handleKeyDown}>
      {tabs.map((tab) => {
        const Icon = TRIP_TAB_ICONS[tab]
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            data-trip={tab}
            aria-selected={tab === value}
            tabIndex={tab === value ? 0 : -1}
            onClick={() => onChange(tab)}
            className="search-tab"
          >
            <Icon className="search-tab-icon" strokeWidth={1.8} aria-hidden="true" />
            {TRIP_TYPE_LABELS[tab]}
          </button>
        )
      })}
    </div>
  )
}
