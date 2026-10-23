"use client"

import { useCallback, useSyncExternalStore } from "react"

/**
 * Collapsed ("rail") state for a portal sidebar, remembered per browser.
 *
 * Both reads go through useSyncExternalStore with a `false` server snapshot,
 * so the server and the first client render agree (expanded), and the stored
 * choice applies right after hydration. The rail only applies at or above
 * `minWidth`: below it the sidebar is a mobile drawer and always full width.
 */

const listeners = new Set<() => void>()

function subscribeStorage(callback: () => void): () => void {
  listeners.add(callback)
  window.addEventListener("storage", callback)
  return () => {
    listeners.delete(callback)
    window.removeEventListener("storage", callback)
  }
}

function readStored(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1"
  } catch {
    return false
  }
}

function writeStored(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, value ? "1" : "0")
  } catch {
    // Private mode or blocked storage: the toggle still works for this tab
    // through the listeners below, it just is not remembered.
  }
  listeners.forEach((listener) => listener())
}

const serverFalse = (): boolean => false

export interface SidebarRail {
  /** The sidebar is collapsed to its icon rail right now. */
  rail: boolean
  /** The viewport is wide enough for the rail, so the toggle should show. */
  canRail: boolean
  toggleRail: () => void
}

export function useSidebarRail(storageKey: string, minWidth: number): SidebarRail {
  const query = `(min-width: ${minWidth}px)`

  const stored = useSyncExternalStore(
    subscribeStorage,
    () => readStored(storageKey),
    serverFalse
  )

  const subscribeMedia = useCallback(
    (callback: () => void) => {
      const media = window.matchMedia(query)
      media.addEventListener("change", callback)
      return () => media.removeEventListener("change", callback)
    },
    [query]
  )
  const canRail = useSyncExternalStore(
    subscribeMedia,
    () => window.matchMedia(query).matches,
    serverFalse
  )

  const toggleRail = useCallback(() => {
    writeStored(storageKey, !readStored(storageKey))
  }, [storageKey])

  return { rail: stored && canRail, canRail, toggleRail }
}
