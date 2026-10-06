'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { PublicBlogCategory } from "@/lib/blog/queries"

interface BoardTabsProps {
  categories: PublicBlogCategory[]
}

/**
 * Segmented category control for the /blog index. Same links and active rule
 * as CategoryTabs (which the category and tag pages keep using).
 */
export function BoardTabs({ categories }: BoardTabsProps) {
  const pathname = usePathname()
  if (categories.length === 0) return null

  const activeSlug = pathname.startsWith('/blog/category/')
    ? pathname.replace('/blog/category/', '')
    : null

  return (
    <nav aria-label="Blog categories" className="blog-board-seg">
      <Link href="/blog" aria-current={activeSlug ? undefined : 'page'}>
        All
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/blog/category/${cat.slug}`}
          aria-current={activeSlug === cat.slug ? 'page' : undefined}
        >
          {cat.name}
        </Link>
      ))}
    </nav>
  )
}
