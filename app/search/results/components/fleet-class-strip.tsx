'use client'

import { useCallback, useRef } from 'react'
import { formatResultPrice } from './format-result-price'
import { useCurrency } from '@/lib/currency/context'

export interface FleetClassTile {
  /** Null is the All tile. */
  id: string | null
  name: string
  count: number
  fromPrice: number | null
}

interface FleetClassStripProps {
  tiles: readonly FleetClassTile[]
  activeId: string | null
  onSelect: (id: string | null) => void
}

/**
 * The class strip: All plus one tile per category, each with its count and
 * from-price. It keeps the tab semantics and keyboard model of the tabs it
 * replaces (arrows, Home, End, roving tabindex).
 */
export function FleetClassStrip({ tiles, activeId, onSelect }: FleetClassStripProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    const last = tiles.length - 1
    const next =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null
    if (next === null) return
    event.preventDefault()
    onSelect(tiles[next].id)
    refs.current[next]?.focus()
  }, [tiles, onSelect])

  return (
    <div role="tablist" aria-label="Vehicle classes" className="results-strip scrollbar-hide">
      {tiles.map((tile, index) => {
        const selected = tile.id === activeId
        return (
          <button
            key={tile.id ?? 'all'}
            ref={(el) => { refs.current[index] = el }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(tile.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className="results-tile"
          >
            <span className="results-tile__top">
              <span className="results-tile__name">{tile.name}</span>
              <span className="results-tile__count numeric">{tile.count}</span>
            </span>
            <span className="results-tile__from">
              {tile.fromPrice === null ? (
                'Unavailable'
              ) : (
                <>from <b className="numeric">{formatResultPrice(tile.fromPrice, currentCurrency, exchangeRates)}</b></>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
