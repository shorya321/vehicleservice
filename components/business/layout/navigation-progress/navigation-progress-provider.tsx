"use client"

/**
 * SCOPE: Business module ONLY. Copy of the admin/vendor provider, kept
 * separate on purpose so the business portal never imports shared layout code.
 */

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime"
import {
  classifyLinkClick,
  classifyNavigation,
  labelForPath,
  labelFromPathname,
  type NavigationKind,
  type NavLabelEntry,
} from "./classify-navigation"
import { anchorOwnLabel, resolvePathname, snapshotAnchor, snapshotClick } from "./dom-snapshot"

/** A navigation that never lands (network drop, cancelled push) must not pin the overlay. */
const SAFETY_TIMEOUT_MS = 12_000
/** How long the finished bar stays at 100% before it fades out. */
const FINISH_HOLD_MS = 320

export type NavigationStatus = "idle" | "loading" | "finishing"

export interface NavigationProgressState {
  status: NavigationStatus
  kind: NavigationKind | null
  label: string | null
  /** Bumps on every start so consumers can restart their animation. */
  runId: number
}

interface NavigationProgressContextValue extends NavigationProgressState {
  start: (kind: NavigationKind, label: string | null) => void
}

const IDLE: NavigationProgressState = { status: "idle", kind: null, label: null, runId: 0 }

const NavigationProgressContext = React.createContext<NavigationProgressContextValue | null>(null)

export function useNavigationProgress(): NavigationProgressContextValue {
  const value = React.useContext(NavigationProgressContext)
  if (!value) throw new Error("useNavigationProgress must be used inside NavigationProgressProvider")
  return value
}

/** Finishes the run once the committed URL changes. Isolated for its Suspense boundary. */
function CompletionWatcher({ onUrlChange }: { onUrlChange: () => void }): null {
  const pathname = usePathname()
  const search = useSearchParams()?.toString() ?? ""
  const url = `${pathname}?${search}`
  const lastUrl = React.useRef(url)

  React.useEffect(() => {
    if (lastUrl.current === url) return
    lastUrl.current = url
    onUrlChange()
  }, [url, onUrlChange])

  return null
}

interface NavigationProgressProviderProps {
  /** Sidebar sections, used to name the page being loaded ("Loading Bookings"). */
  navLabels: readonly NavLabelEntry[]
  children: React.ReactNode
}

export function NavigationProgressProvider({ navLabels, children }: NavigationProgressProviderProps) {
  const router = useRouter()
  const [state, setState] = React.useState<NavigationProgressState>(IDLE)
  const timers = React.useRef<{ safety?: number; finish?: number }>({})

  const clearTimers = React.useCallback(() => {
    window.clearTimeout(timers.current.safety)
    window.clearTimeout(timers.current.finish)
    timers.current = {}
  }, [])

  const finish = React.useCallback(() => {
    clearTimers()
    setState((prev) => (prev.status === "loading" ? { ...prev, status: "finishing" } : prev))
    timers.current.finish = window.setTimeout(() => {
      setState((prev) => (prev.status === "finishing" ? { ...IDLE, runId: prev.runId } : prev))
    }, FINISH_HOLD_MS)
  }, [clearTimers])

  const start = React.useCallback(
    (kind: NavigationKind, label: string | null) => {
      clearTimers()
      setState((prev) => ({ status: "loading", kind, label, runId: prev.runId + 1 }))
      timers.current.safety = window.setTimeout(finish, SAFETY_TIMEOUT_MS)
    },
    [clearTimers, finish]
  )

  React.useEffect(() => clearTimers, [clearTimers])

  const sectionLabel = React.useCallback(
    (href: string): string | null => {
      const pathname = resolvePathname(href)
      return pathname ? labelForPath(pathname, navLabels) ?? labelFromPathname(pathname) : null
    },
    [navLabels]
  )

  // Every <Link> and plain <a> inside the portal. Capture phase, so a link
  // whose own onClick stops propagation is still seen.
  React.useEffect(() => {
    function onClick(event: MouseEvent): void {
      if (!(event.target instanceof Element)) return
      const anchor = event.target.closest("a")
      if (!anchor || !anchor.hasAttribute("href")) return
      const kind = classifyLinkClick(
        snapshotClick(event),
        snapshotAnchor(anchor, event.target),
        window.location.href
      )
      if (kind) start(kind, sectionLabel(anchor.href) ?? anchorOwnLabel(anchor))
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [start, sectionLabel])

  // Every router.push / router.replace below this provider (header menu, notifications,
  // form saves, the command palette) goes through this wrapper, so call sites need
  // no changes. useRouter() reads AppRouterContext, and <Link> only uses it
  // for prefetching, which the spread keeps intact.
  const trackedRouter = React.useMemo<AppRouterInstance>(() => {
    const track = (href: string): void => {
      const kind = classifyNavigation(href, window.location.href)
      if (kind) start(kind, sectionLabel(href))
    }
    return {
      ...router,
      push: (href, options) => {
        track(href)
        router.push(href, options)
      },
      replace: (href, options) => {
        track(href)
        router.replace(href, options)
      },
    }
  }, [router, start, sectionLabel])

  const value = React.useMemo<NavigationProgressContextValue>(() => ({ ...state, start }), [state, start])

  return (
    <NavigationProgressContext.Provider value={value}>
      <AppRouterContext.Provider value={trackedRouter}>
        <React.Suspense fallback={null}>
          <CompletionWatcher onUrlChange={finish} />
        </React.Suspense>
        {children}
      </AppRouterContext.Provider>
    </NavigationProgressContext.Provider>
  )
}
