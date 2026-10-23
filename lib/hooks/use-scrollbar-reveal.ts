"use client"

import { useEffect } from "react"

/** How long a scrollbar stays visible after the last scroll event. */
export const SCROLLBAR_HIDE_DELAY_MS = 900

/**
 * Shows portal scrollbars only while they are scrolling. Marks the element
 * that scrolled with `data-scrolling` and clears it once scrolling stops;
 * the CSS in app/admin/globals.css keeps the thumb transparent otherwise.
 *
 * Scroll events do not bubble, so one capture-phase listener on the document
 * sees every scroller (main, the sidebar nav, table wrappers) without
 * wiring each one.
 */
export function useScrollbarReveal(): void {
  useEffect(() => {
    const timers = new WeakMap<Element, number>()

    const onScroll = (event: Event) => {
      const el = event.target
      if (!(el instanceof Element) || !el.closest(".portal-shell")) return
      if (!el.hasAttribute("data-scrolling")) el.setAttribute("data-scrolling", "")
      const pending = timers.get(el)
      if (pending !== undefined) window.clearTimeout(pending)
      timers.set(
        el,
        window.setTimeout(() => {
          el.removeAttribute("data-scrolling")
          timers.delete(el)
        }, SCROLLBAR_HIDE_DELAY_MS)
      )
    }

    document.addEventListener("scroll", onScroll, { capture: true, passive: true })
    return () => document.removeEventListener("scroll", onScroll, { capture: true })
  }, [])
}
