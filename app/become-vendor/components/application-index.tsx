"use client"

import { useEffect, useState } from "react"
import {
  useApplicationProgress,
  type ApplicationProgress,
} from "@/components/vendor-application/application-progress"

/**
 * The left rail's running marker.
 *
 * The pitch column is sticky and its content ran out around 600px, while the form runs
 * to roughly 1560px: for most of the application the applicant was looking at an empty
 * half-page. This is an editorial table of contents, not a progress bar. No percentage,
 * no steps-remaining, no chrome. Ordinals belong here rather than on the benefits,
 * because these three are a real sequence and those three were not.
 *
 * Decorative to assistive technology: the fieldsets and their legends are the real
 * structure, and repeating them here would only add a second, weaker copy.
 */
const SECTIONS = [
  { id: "vendor-section-business", ordinal: "01", label: "Business information", key: "business" },
  { id: "vendor-section-documents", ordinal: "02", label: "Verification documents", key: "documents" },
  { id: "vendor-section-banking", ordinal: "03", label: "Banking details", key: "banking" },
] as const

/**
 * "4 of 8" per section. Banking reads "Optional" until something is typed in it, since
 * "0 of 5" there would read as work outstanding on a section that can be skipped.
 */
function sectionMeta(
  key: keyof ApplicationProgress,
  progress: ApplicationProgress | null
): { text: string; started: boolean } {
  const section = progress?.[key]
  if (!section || (key === "banking" && section.filled === 0)) {
    return { text: key === "banking" ? "Optional" : "", started: false }
  }
  return { text: `${section.filled} of ${section.total}`, started: section.filled > 0 }
}

export function ApplicationIndex() {
  const [currentId, setCurrentId] = useState<string>(SECTIONS[0].id)
  const progress = useApplicationProgress()

  useEffect(() => {
    const nodes = SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (node): node is HTMLElement => node !== null
    )
    if (nodes.length === 0) return

    // Tracks the topmost section still intersecting the upper band of the viewport, so
    // the marker moves once per boundary instead of flickering between two neighbours.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length === 0) return
        const topmost = visible.reduce((a, b) =>
          a.boundingClientRect.top <= b.boundingClientRect.top ? a : b
        )
        setCurrentId(topmost.target.id)
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: 0 }
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  return (
    <div aria-hidden="true" className="mt-10">
      <p className="editorial-eyebrow">Your progress</p>
      <ol className="mt-4 list-none p-0 m-0">
        {SECTIONS.map((section) => {
          const isCurrent = section.id === currentId
          const meta = sectionMeta(section.key, progress)
          return (
            <li
              key={section.id}
              className={`
                grid grid-cols-[2.25rem_1fr_auto] items-baseline gap-x-3.5 py-3
                border-t border-[var(--graphite)] last:border-b
                transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                motion-reduce:transition-none
                ${isCurrent ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}
              `}
            >
              <span
                className={`text-xs tracking-[0.14em] tabular-nums ${
                  isCurrent ? "text-[var(--gold-text)]" : ""
                }`}
              >
                {section.ordinal}
              </span>
              <span className={`text-sm ${isCurrent ? "font-medium" : ""}`}>{section.label}</span>
              <span
                className={`t-label text-[0.625rem] tabular-nums ${
                  isCurrent && meta.started ? "text-[var(--gold-text)]" : ""
                }`}
              >
                {meta.text}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
