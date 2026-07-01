'use client'

import { useEffect, useState, useCallback } from 'react'

export interface TocSection {
  id: string
  title: string
}

interface TableOfContentsProps {
  sections: TocSection[]
}

export function TableOfContents({ sections }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-112px 0px -60% 0px', threshold: 0 }
    )

    for (const section of sections) {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [sections])

  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      setIsOpen(false)
    }
  }, [])

  const linkClass = (id: string) =>
    `block py-1.5 text-[0.8125rem] leading-snug transition-colors cursor-pointer ${
      activeId === id
        ? 'text-[var(--gold-text)] border-l-2 border-[var(--gold)] pl-3'
        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] border-l-2 border-transparent pl-3'
    }`

  return (
    <>
      {/* Mobile: collapsible */}
      <details
        className="lg:hidden border border-[var(--graphite)] rounded-md mb-8"
        open={isOpen}
        onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="px-4 py-3 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)] cursor-pointer select-none">
          Table of Contents
        </summary>
        <nav aria-label="Table of contents" className="px-4 pb-4">
          <ul className="space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => handleClick(section.id)}
                  className={linkClass(section.id)}
                >
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </details>

      {/* Desktop: sticky sidebar */}
      <nav aria-label="Table of contents" className="hidden lg:block">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)] mb-4">
          Contents
        </p>
        <ul className="space-y-1">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => handleClick(section.id)}
                className={linkClass(section.id)}
              >
                {section.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
