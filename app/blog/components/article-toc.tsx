'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import { ChevronDown } from 'lucide-react'

export interface TocItem {
  id: string
  label: string
}

interface ArticleTocProps {
  items: TocItem[]
  /** `rail`: sticky card in the left column from 1024px. `inline`: collapsible list above the text below 1024px. */
  variant: 'rail' | 'inline'
}

/** A section counts as "being read" once its top passes this line (fixed header plus breathing room). */
const READ_LINE = 140

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Highlights the section being read and jumps to a section on click. */
export function ArticleToc({ items, variant }: ArticleTocProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let frame = 0
    // The last section whose top has crossed the reading line. Position based rather than
    // IntersectionObserver, so a short section next to a long one still wins when it is on top.
    const update = () => {
      frame = 0
      let current = items[0]?.id ?? ''
      for (const item of items) {
        const el = document.getElementById(item.id)
        if (el && el.getBoundingClientRect().top - READ_LINE <= 0) current = item.id
      }
      setActiveId(current)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [items])

  const jump = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    event.preventDefault()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    window.history.replaceState(null, '', `#${id}`)
    setActiveId(id)
    setOpen(false)
  }

  const activeIndex = Math.max(0, items.findIndex((item) => item.id === activeId))
  const progress = items.length > 0 ? ((activeIndex + 1) / items.length) * 100 : 0

  const list = (
    <ol className="article-toc__list">
      {items.map((item, i) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            onClick={(e) => jump(e, item.id)}
            className="article-toc__link"
            aria-current={item.id === activeId ? 'location' : undefined}
          >
            <span className="article-toc__num" aria-hidden="true">{pad(i + 1)}</span>
            <span>{item.label}</span>
          </a>
        </li>
      ))}
    </ol>
  )

  if (variant === 'inline') {
    return (
      <details className="article-toc article-toc--inline" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary className="article-toc__summary">
          <span className="article-toc__title">On this page</span>
          <ChevronDown className="article-toc__chevron h-4 w-4" aria-hidden="true" />
        </summary>
        <nav aria-label="On this page">{list}</nav>
      </details>
    )
  }

  return (
    <div className="blog-board-bezel article-toc article-toc--rail">
      <nav aria-label="On this page" className="blog-board-core article-toc__card">
        <p className="article-toc__title">On this page</p>
        {list}
        <div className="article-toc__track" aria-hidden="true">
          <div className="article-toc__fill" style={{ width: `${progress}%` }} />
        </div>
      </nav>
    </div>
  )
}
