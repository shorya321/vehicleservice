"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNavigationProgress } from "./navigation-progress-provider"

/** Prefetched pages usually land inside this window; showing the overlay for them is a flash. */
const SHOW_DELAY_MS = 150

/**
 * Covers the page content (not the sidebar or header) while a different page
 * is loading. Query-only changes, such as filters and pagination, keep the
 * current page visible and rely on the top bar alone.
 */
export function ContentLoader() {
  const { status, kind, label, runId } = useNavigationProgress()
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
      className={cn(
        "absolute inset-0 z-[60] flex items-center justify-center bg-background/70 backdrop-blur-[3px]",
        "transition-opacity duration-200 ease-out motion-reduce:transition-none",
        shown ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "flex min-w-[220px] flex-col items-center gap-4 rounded-2xl border border-border bg-card px-8 py-7",
          "shadow-[0_18px_50px_-20px_rgba(0,0,0,0.45),0_0_0_1px_hsl(var(--primary)/0.06)]",
          "transition-transform duration-200 ease-out motion-reduce:transition-none",
          shown ? "translate-y-0 scale-100" : "translate-y-1 scale-[0.98]"
        )}
      >
        <span className="relative flex h-11 w-11 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-2 border-primary/15" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary border-r-primary/60 motion-reduce:animate-none" />
          <span className="h-2 w-2 rounded-full bg-primary motion-safe:animate-pulse" />
        </span>
        <span className="flex flex-col items-center gap-1 text-center">
          <span className="text-sm font-medium text-foreground">{showText ? text : ""}</span>
          <span className="text-xs text-muted-foreground">Please wait a moment</span>
        </span>
      </div>
    </div>
  )
}
