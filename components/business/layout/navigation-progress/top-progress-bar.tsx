"use client"

/**
 * SCOPE: Business module ONLY.
 *
 * Thin bar across the very top of the viewport in the tenant's brand colour
 * (`--business-primary`, set per tenant by the portal layout and the theme
 * provider). Sits above the fixed header (z-30) and sidebar (z-50) and never
 * takes pointer events.
 */

import * as React from "react"
import { useNavigationProgress } from "./navigation-progress-provider"

const TRICKLE_INTERVAL_MS = 280
/** The bar approaches this share asymptotically and only completes when the page lands. */
const TRICKLE_CEILING = 0.9
const START_AT = 0.12
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"

export function TopProgressBar() {
  const { status, runId } = useNavigationProgress()
  const [progress, setProgress] = React.useState(0)
  const [animate, setAnimate] = React.useState(false)

  React.useEffect(() => {
    if (status !== "loading") return
    // Snap back to 0 without a transition, then grow from there.
    setAnimate(false)
    setProgress(0)
    const frame = window.requestAnimationFrame(() => {
      setAnimate(true)
      setProgress(START_AT)
    })
    const trickle = window.setInterval(() => {
      setProgress((p) => p + (TRICKLE_CEILING - p) * 0.12)
    }, TRICKLE_INTERVAL_MS)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearInterval(trickle)
    }
  }, [status, runId])

  React.useEffect(() => {
    if (status === "finishing") {
      setAnimate(true)
      setProgress(1)
    }
  }, [status])

  const visible = status === "loading" || status === "finishing"

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]"
      style={{
        opacity: status === "loading" ? 1 : 0,
        transition: `opacity ${status === "finishing" ? 260 : 0}ms ease-out ${status === "finishing" ? 140 : 0}ms`,
      }}
    >
      <div
        className="h-full origin-left"
        style={{
          transform: `scaleX(${visible ? progress : 0})`,
          transition: animate ? `transform 300ms ${EASE}` : "none",
          background: "linear-gradient(90deg, var(--business-primary), var(--business-primary-400))",
          boxShadow: "0 0 8px color-mix(in srgb, var(--business-primary-400) 60%, transparent)",
        }}
      />
    </div>
  )
}
