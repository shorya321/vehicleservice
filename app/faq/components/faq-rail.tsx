'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export interface FaqRailTopic {
  id: string
  name: string
  count: number
}

/** Below this many pixels from the viewport top, a topic counts as the one being read. */
const ACTIVE_OFFSET = 160

/** Where "Ask the team" goes. */
export const CONTACT_HREF = '/contact'

/**
 * Sticky topic menu, desktop only (phones use the hero chips). Highlights the
 * topic whose heading has most recently passed the top of the viewport.
 */
export function FaqRail({ topics }: { topics: FaqRailTopic[] }) {
  const [active, setActive] = useState(topics[0]?.id ?? '')

  useEffect(() => {
    function update(): void {
      let current = topics[0]?.id ?? ''
      for (const topic of topics) {
        const el = document.getElementById(topic.id)
        if (el && el.getBoundingClientRect().top < ACTIVE_OFFSET) {
          current = topic.id
        }
      }
      setActive(current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [topics])

  return (
    <aside className="faq-page__rail" aria-label="Topics">
      <div className="blog-board-bezel faq-page__rail-box">
        <nav className="blog-board-core faq-page__rail-core">
          <p className="faq-page__rail-label">Topics</p>
          {topics.map((topic) => (
            <a key={topic.id} href={`#${topic.id}`} aria-current={active === topic.id ? 'location' : undefined}>
              {topic.name}
              <small className="numeric">{topic.count}</small>
            </a>
          ))}
          <p className="faq-page__rail-help">
            Not listed? <Link href={CONTACT_HREF}>Ask the team</Link>
          </p>
        </nav>
      </div>
    </aside>
  )
}
