'use client'

/**
 * Scroll behaviour for the currency picker list.
 *
 * Two jobs: reveal the selected currency when it opens below the fold, and
 * report whether the list still has content past the bottom edge so the panel
 * can fade its lower boundary.
 */

import { useCallback, useEffect, useState, type RefObject } from 'react'

interface CurrencyScroll {
  showFade: boolean
  syncFade: () => void
}

export function useCurrencyScroll(
  open: boolean,
  scrollRef: RefObject<HTMLDivElement | null>,
  gridsRef: RefObject<HTMLDivElement | null>,
  contentKey: string
): CurrencyScroll {
  const [showFade, setShowFade] = useState(false)

  const syncFade = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const overflows = el.scrollHeight - el.clientHeight > 4
    const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 6
    setShowFade(overflows && !atEnd)
  }, [scrollRef])

  // A currency outside the Featured row opens below the fold, which would show
  // an apparently empty selection. "nearest" scrolls only when it is off screen,
  // so the common case (a featured currency) still opens at the top of the list.
  //
  // Deferred twice: Radix moves focus to the search field after mount, and
  // focusing scrolls the container back to the top, undoing an earlier scroll.
  useEffect(() => {
    if (!open) return

    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        gridsRef.current
          ?.querySelector('[aria-checked="true"]')
          ?.scrollIntoView({ block: 'nearest' })
      })
    })

    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [open, gridsRef])

  // The fade depends on measured layout, so it is driven by a ResizeObserver
  // rather than measured inline: the observer's first callback supplies the
  // initial value and every later content change updates it for free.
  useEffect(() => {
    const el = scrollRef.current
    if (!open || !el) return

    const observer = new ResizeObserver(syncFade)
    observer.observe(el)
    Array.from(el.children).forEach((child) => observer.observe(child))

    return () => observer.disconnect()
  }, [open, contentKey, scrollRef, syncFade])

  return { showFade, syncFade }
}
