'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

interface BlogHeroProps {
  title: string
  subtitle?: string
  eyebrow?: string
  showSearch?: boolean
  initialSearch?: string
}

export function BlogHero({ title, subtitle, eyebrow = "Our Blog", showSearch = false, initialSearch = '' }: BlogHeroProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (trimmed) {
      router.push(`/blog?search=${encodeURIComponent(trimmed)}`)
    } else {
      router.push('/blog')
    }
  }

  return (
    <section className="pt-[clamp(4rem,10vw,6rem)] pb-[clamp(3.5rem,8vw,5rem)] bg-[var(--black-void)] border-b border-[var(--graphite)] blog-hero-glow blog-hero-animate">
      <div className="luxury-container text-center">
        {/* Eyebrow */}
        <div className="blog-hero__eyebrow flex items-center justify-center gap-3 mb-6" aria-hidden="true">
          <span className="w-6 h-px bg-[var(--gold)]" />
          <span className="t-label-accent">{eyebrow}</span>
          <span className="w-6 h-px bg-[var(--gold)]" />
        </div>

        {/* Title */}
        <h1 className="blog-hero__title t-display mb-4">{title}</h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="blog-hero__subtitle t-body max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}

        {/* Search */}
        {showSearch && (
          <form onSubmit={handleSearch} className="blog-hero__search mt-8 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
              <input
                type="text"
                aria-label="Search articles"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[var(--black-warm)] border border-[var(--gold)]/20 rounded-[4px] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] focus:ring-[3px] focus:ring-[var(--gold)]/10 transition-all duration-200"
              />
            </div>
          </form>
        )}

        {/* Decorative hairline */}
        {!showSearch && (
          <div className="blog-hero__rule mt-8 flex justify-center" aria-hidden="true">
            <div className="w-20 h-px bg-[var(--gold)]" />
          </div>
        )}
      </div>
    </section>
  )
}
