'use client'

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { PublicBlogCategory } from "@/lib/blog/queries"

interface CategoryTabsProps {
  categories: PublicBlogCategory[]
}

export function CategoryTabs({ categories }: CategoryTabsProps) {
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category')

  if (categories.length === 0) return null

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <Link
        href="/blog"
        className={`shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 border ${
          !activeCategory
            ? 'bg-[var(--gold)] text-[var(--black-void)] border-[var(--gold)]'
            : 'text-[var(--text-secondary)] border-[var(--gold)]/20 hover:border-[var(--gold)]/50 hover:text-[var(--text-primary)]'
        }`}
      >
        All
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/blog/category/${cat.slug}`}
          className={`shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 border ${
            activeCategory === cat.slug
              ? 'bg-[var(--gold)] text-[var(--black-void)] border-[var(--gold)]'
              : 'text-[var(--text-secondary)] border-[var(--gold)]/20 hover:border-[var(--gold)]/50 hover:text-[var(--text-primary)]'
          }`}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  )
}
