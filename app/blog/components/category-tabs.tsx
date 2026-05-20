'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { PublicBlogCategory } from "@/lib/blog/queries"

interface CategoryTabsProps {
  categories: PublicBlogCategory[]
}

export function CategoryTabs({ categories }: CategoryTabsProps) {
  const pathname = usePathname()
  const activeSlug = pathname.startsWith('/blog/category/')
    ? pathname.replace('/blog/category/', '')
    : null

  if (categories.length === 0) return null

  const isAllActive = !activeSlug

  return (
    <nav aria-label="Blog categories" className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <Link
        href="/blog"
        aria-current={isAllActive ? 'page' : undefined}
        className={`shrink-0 px-5 py-2 min-h-[44px] flex items-center text-sm font-medium rounded-full transition-all duration-300 border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] ${
          isAllActive
            ? 'bg-[var(--gold)] text-[var(--onyx)] border-[var(--gold)] font-semibold'
            : 'text-[var(--text-secondary)] border-[var(--graphite)] hover:border-[var(--gold)] hover:text-[var(--gold-text)]'
        }`}
      >
        All
      </Link>
      {categories.map((cat) => {
        const isActive = activeSlug === cat.slug
        return (
          <Link
            key={cat.id}
            href={`/blog/category/${cat.slug}`}
            aria-current={isActive ? 'page' : undefined}
            className={`shrink-0 px-5 py-2 min-h-[44px] flex items-center text-sm font-medium rounded-full transition-all duration-300 border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] ${
              isActive
                ? 'bg-[var(--gold)] text-[var(--onyx)] border-[var(--gold)] font-semibold'
                : 'text-[var(--text-secondary)] border-[var(--graphite)] hover:border-[var(--gold)] hover:text-[var(--gold-text)]'
            }`}
          >
            {cat.name}
          </Link>
        )
      })}
    </nav>
  )
}
