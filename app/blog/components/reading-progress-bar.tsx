'use client'

import { useEffect, useRef, useState } from 'react'

export function ReadingProgressBar() {
  const barRef = useRef<HTMLDivElement>(null)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return

    const article = document.querySelector('.article-page__body')
    if (!article) return

    let ticking = false
    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const rect = (article as Element).getBoundingClientRect()
        const total = rect.height - window.innerHeight
        if (total <= 0) {
          bar!.style.transform = 'scaleX(1)'
          bar!.style.opacity = '1'
          ticking = false
          return
        }
        const progress = Math.min(1, Math.max(0, -rect.top / total))
        bar!.style.transform = `scaleX(${progress})`
        bar!.style.opacity = progress > 0 ? '1' : '0'
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      ref={barRef}
      className="reading-progress-bar"
      style={{
        transitionProperty: reduceMotion ? 'none' : 'opacity',
        transitionDuration: reduceMotion ? '0ms' : '200ms',
      }}
      role="progressbar"
      aria-label="Reading progress"
    />
  )
}
