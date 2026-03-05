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
    <section className="relative py-14 md:py-20 bg-[var(--black-void)] overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--gold) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Gradient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[var(--gold)]/5 blur-[100px] rounded-full" />

      <div className="relative z-10 luxury-container text-center">
        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="w-8 h-px bg-gradient-to-r from-transparent to-[var(--gold)]" />
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-[var(--gold)]">
            {eyebrow}
          </span>
          <span className="w-8 h-px bg-gradient-to-l from-transparent to-[var(--gold)]" />
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[var(--text-primary)] mb-4">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}

        {/* Search */}
        {showSearch && (
          <form onSubmit={handleSearch} className="mt-8 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[var(--charcoal)] border border-[var(--gold)]/20 rounded-full text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)]/50 transition-colors duration-300"
              />
            </div>
          </form>
        )}

        {/* Decorative line */}
        {!showSearch && (
          <div className="mt-8 flex justify-center">
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
          </div>
        )}
      </div>
    </section>
  )
}
