'use client'

/**
 * Roving arrow-key focus for the currency grid.
 *
 * Card order in the DOM is the reading order, so left/right step one card and
 * up/down step one row. Column count is read back off the resolved grid rather
 * than hard-coded, so it stays correct at every breakpoint. Stepping up past
 * the first row returns focus to the search field.
 */

import { useCallback, type KeyboardEvent, type RefObject } from 'react'

const ARROW_KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']

function columnCountOf(grid: Element | null): number {
  if (!(grid instanceof HTMLElement)) return 1
  const template = window.getComputedStyle(grid).gridTemplateColumns
  const columns = template.split(' ').filter(Boolean).length
  return columns > 0 ? columns : 1
}

export function useCurrencyGridKeys(
  containerRef: RefObject<HTMLDivElement | null>,
  searchRef: RefObject<HTMLInputElement | null>
): (event: KeyboardEvent<HTMLDivElement>) => void {
  return useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!ARROW_KEYS.includes(event.key)) return

      const container = containerRef.current
      const active = document.activeElement
      if (!container || !(active instanceof HTMLElement)) return

      const cards = Array.from(
        container.querySelectorAll<HTMLButtonElement>('[data-currency-card]')
      )
      const index = cards.indexOf(active as HTMLButtonElement)
      if (index === -1) return

      const columns = columnCountOf(active.parentElement)

      let next = index
      if (event.key === 'ArrowRight') next = index + 1
      if (event.key === 'ArrowLeft') next = index - 1
      if (event.key === 'ArrowDown') next = index + columns
      if (event.key === 'ArrowUp') next = index - columns

      event.preventDefault()

      if (next < 0) {
        searchRef.current?.focus()
        return
      }

      cards[Math.min(next, cards.length - 1)]?.focus()
    },
    [containerRef, searchRef]
  )
}
