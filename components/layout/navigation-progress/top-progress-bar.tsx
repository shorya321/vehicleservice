"use client"

import * as React from "react"
import { useNavigationProgress } from "./navigation-progress-provider"

const TRICKLE_INTERVAL_MS = 280
/** The bar approaches this share asymptotically and only completes when the page lands. */
const TRICKLE_CEILING = 0.9
const START_AT = 0.12
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"

/**
 * Thin primary-coloured bar across the very top of the viewport. Sits above
 * the sidebar and header (both z-50) and never takes pointer events.
 */
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
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]"
      style={{
        opacity: status === "loading" ? 1 : 0,
        transition: `opacity ${status === "finishing" ? 260 : 0}ms ease-out ${status === "finishing" ? 140 : 0}ms`,
      }}
    >
      <div
        className="relative h-full origin-left bg-primary"
        style={{
          transform: `scaleX(${visible ? progress : 0})`,
          transition: animate ? `transform 300ms ${EASE}` : "none",
          boxShadow: "0 0 8px hsl(var(--primary) / 0.55)",
        }}
      />
    </div>
  )
}
