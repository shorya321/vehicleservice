'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Search } from 'lucide-react'

interface BoardSearchProps {
  initialSearch?: string
}

/** Hero search. Same contract as BlogSearch: /blog?search=term, or /blog when empty. */
export function BoardSearch({ initialSearch = '' }: BoardSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialSearch)

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): void {
    e.preventDefault()
    const trimmed = query.trim()
    router.push(trimmed ? `/blog?search=${encodeURIComponent(trimmed)}` : '/blog')
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="blog-board-bezel blog-board-search">
      <div className="blog-board-core blog-board-search__core">
        <Search className="h-[18px] w-[18px] shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
        <label htmlFor="blog-search" className="sr-only">Search articles</label>
        <input
          id="blog-search"
          type="search"
          placeholder="Terminal, hotel or district"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="blog-board-btn">
          Search
          <span className="blog-board-btn__ic" aria-hidden="true">
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
          </span>
        </button>
      </div>
    </form>
  )
}
