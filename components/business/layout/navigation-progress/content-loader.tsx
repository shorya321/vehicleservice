"use client"

/**
 * SCOPE: Business module ONLY.
 *
 * Covers the page content (not the sidebar or header) while a different page
 * is loading, in the tenant's theme. The business portal scrolls the window,
 * not <main>, so this is `fixed` and offset to the content column: below the
 * 56px header and right of the sidebar (72px collapsed, 256px expanded, none
 * on mobile), matching BusinessPortalContent and BusinessHeader.
 *
 * Query-only changes (filters, pagination) keep the page visible and rely on
 * the top bar alone.
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/business/sidebar-context"
import { useNavigationProgress } from "./navigation-progress-provider"

/** Prefetched pages usually land inside this window; showing the overlay for them is a flash. */
const SHOW_DELAY_MS = 150
const SIDEBAR_EXPANDED = 256
const SIDEBAR_COLLAPSED = 72

export function ContentLoader() {
  const { status, kind, label, runId } = useNavigationProgress()
  const { isCollapsed } = useSidebar()
  const active = status === "loading" && kind === "page"
  const [shown, setShown] = React.useState(false)

  React.useEffect(() => {
    if (!active) {
      setShown(false)
      return
    }
    const timer = window.setTimeout(() => setShown(true), SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [active, runId])

  const text = label ? `Loading ${label}` : "Loading page"
  // Keep the words through the fade-out instead of blanking mid-fade.
  const showText = shown || status === "finishing"

  return (
    <div
      aria-hidden={!shown}
      style={{ left: isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED }}
      className={cn(
        // z-[25]: above page content (z-10), below the fixed header (z-30).
        "fixed bottom-0 right-0 top-14 z-[25] flex items-center justify-center max-md:!left-0",
        "bg-background/60 backdrop-blur-[3px]",
        "transition-[opacity,left] duration-200 ease-out motion-reduce:transition-none",
        shown ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "flex min-w-[220px] flex-col items-center gap-4 rounded-2xl border px-8 py-7",
          "border-[var(--business-border-default)] bg-[var(--business-surface-1)]",
          "shadow-[0_18px_50px_-20px_rgba(0,0,0,0.45)]",
          "transition-transform duration-200 ease-out motion-reduce:transition-none",
          shown ? "translate-y-0 scale-100" : "translate-y-1 scale-[0.98]"
        )}
      >
        <span className="relative flex h-11 w-11 items-center justify-center">
          <span
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: "color-mix(in srgb, var(--business-primary) 18%, transparent)" }}
          />
          <span
            className="absolute inset-0 animate-spin rounded-full border-2 border-transparent motion-reduce:animate-none"
            style={{ borderTopColor: "var(--business-primary)", borderRightColor: "var(--business-primary-400)" }}
          />
          <span
            className="h-2 w-2 rounded-full motion-safe:animate-pulse"
            style={{ backgroundColor: "var(--business-primary)" }}
          />
        </span>
        <span className="flex flex-col items-center gap-1 text-center">
          <span className="text-sm font-medium text-[var(--business-text-primary)]">{showText ? text : ""}</span>
          <span className="text-xs text-[var(--business-text-muted)]">Please wait a moment</span>
        </span>
      </div>
    </div>
  )
}
