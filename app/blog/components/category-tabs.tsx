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
    <nav role="tablist" aria-label="Blog categories" className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <Link
        href="/blog"
        role="tab"
        aria-selected={isAllActive}
        className={`shrink-0 px-5 py-2.5 min-h-[44px] flex items-center text-sm font-medium rounded-full transition-all duration-300 border ${
          isAllActive
            ? 'bg-[var(--gold)] text-[var(--black-void)] border-[var(--gold)]'
            : 'text-[var(--text-secondary)] border-[var(--gold)]/20 hover:border-[var(--gold)]/50 hover:text-[var(--text-primary)]'
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
            role="tab"
            aria-selected={isActive}
            className={`shrink-0 px-5 py-2.5 min-h-[44px] flex items-center text-sm font-medium rounded-full transition-all duration-300 border ${
              isActive
                ? 'bg-[var(--gold)] text-[var(--black-void)] border-[var(--gold)]'
                : 'text-[var(--text-secondary)] border-[var(--gold)]/20 hover:border-[var(--gold)]/50 hover:text-[var(--text-primary)]'
            }`}
          >
            {cat.name}
          </Link>
        )
      })}
    </nav>
  )
}
