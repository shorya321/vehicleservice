'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PublicBlogPost } from '@/lib/blog/queries'
import { RelatedCard } from './related-card'

interface RelatedScrollProps {
  posts: PublicBlogPost[]
}

export function RelatedScroll({ posts }: RelatedScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scrollLeft() {
    scrollRef.current?.scrollBy({ left: -350, behavior: 'smooth' })
  }

  function scrollRight() {
    scrollRef.current?.scrollBy({ left: 350, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <div ref={scrollRef} role="region" aria-label="Related articles" className="blog-related-scroll">
        {posts.map((post) => (
          <div key={post.id}>
            <RelatedCard post={post} />
          </div>
        ))}
      </div>

      <button
        onClick={scrollLeft}
        aria-label="Scroll left"
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-11 h-11 rounded-full bg-[var(--black-void)] border border-[var(--graphite)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--gold-text)] hover:border-[var(--gold)]/50 transition-all duration-200 hidden md:flex"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        onClick={scrollRight}
        aria-label="Scroll right"
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-11 h-11 rounded-full bg-[var(--black-void)] border border-[var(--graphite)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--gold-text)] hover:border-[var(--gold)]/50 transition-all duration-200 hidden md:flex"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
