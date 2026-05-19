'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

interface BlogSearchProps {
  initialSearch?: string
}

export function BlogSearch({ initialSearch = '' }: BlogSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialSearch)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/blog?search=${encodeURIComponent(trimmed)}`)
    } else {
      router.push('/blog')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 max-w-md">
      <div className="relative">
        <label htmlFor="blog-search" className="sr-only">Search articles</label>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          id="blog-search"
          type="text"
          placeholder="Search articles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-[var(--black-warm)] border border-[var(--graphite)] rounded-full text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/10 transition-all duration-200"
        />
      </div>
    </form>
  )
}
