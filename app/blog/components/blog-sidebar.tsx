'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Search, CheckCircle } from 'lucide-react'
import type { PublicBlogPost, PublicBlogCategory } from '@/lib/blog/queries'

interface BlogSidebarProps {
  categories: PublicBlogCategory[]
  recentPosts: PublicBlogPost[]
  popularTags: { id: string; name: string; slug: string; count: number }[]
}

function formatShortDate(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function BlogSidebar({ categories, recentPosts, popularTags }: BlogSidebarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/blog?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newsletterEmail.trim()) {
      setNewsletterSubmitted(true)
    }
  }

  return (
    <div className="blog-sidebar">
      {/* Search */}
      <div className="sidebar-widget">
        <div className="widget-title">
          <span className="widget-title-line" />
          <span className="widget-title-text">Search</span>
        </div>
        <form onSubmit={handleSearch} className="search-input-wrapper">
          <Search className="sidebar-search-icon w-4 h-4" />
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="sidebar-widget">
          <div className="widget-title">
            <span className="widget-title-line" />
            <span className="widget-title-text">Categories</span>
          </div>
          <ul className="list-none">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/blog/category/${cat.slug}`}
                  className="sidebar-category-item"
                >
                  <span>{cat.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Articles */}
      {recentPosts.length > 0 && (
        <div className="sidebar-widget">
          <div className="widget-title">
            <span className="widget-title-line" />
            <span className="widget-title-text">Recent Articles</span>
          </div>
          {recentPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="sidebar-recent-article"
            >
              {post.featured_image_url ? (
                <Image
                  src={post.featured_image_url}
                  alt={post.title}
                  width={60}
                  height={44}
                  className="w-[60px] h-[44px] rounded-md object-cover flex-shrink-0 border border-[var(--gold)]/10"
                />
              ) : (
                <div className="w-[60px] h-[44px] rounded-md flex-shrink-0 bg-[var(--charcoal)] border border-[var(--gold)]/10 flex items-center justify-center">
                  <span className="text-[var(--gold)]/30 text-sm font-serif">B</span>
                </div>
              )}
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[0.8125rem] font-medium text-[var(--text-primary)] leading-[1.3] line-clamp-2">
                  {post.title}
                </span>
                <span className="text-[0.6875rem] text-[var(--text-muted)]">
                  {formatShortDate(post.published_at)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Tags Cloud */}
      {popularTags.length > 0 && (
        <div className="sidebar-widget">
          <div className="widget-title">
            <span className="widget-title-line" />
            <span className="widget-title-text">Popular Tags</span>
          </div>
          <div className="sidebar-tags-cloud">
            {popularTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/blog/tag/${tag.slug}`}
                className="tag-pill inline-block px-2.5 py-1 text-[0.75rem] font-medium text-[var(--text-muted)] border border-[var(--gold)]/20 rounded-full hover:text-[var(--gold)] hover:border-[var(--gold)]/50 hover:bg-[var(--gold)]/5 transition-all duration-200"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter */}
      <div className="sidebar-widget sidebar-newsletter-widget">
        <div className="widget-title">
          <span className="widget-title-line" />
          <span className="widget-title-text">Newsletter</span>
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
          Get curated travel insights and exclusive offers delivered to your inbox. No spam, just the finest.
        </p>
        {!newsletterSubmitted ? (
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              className="sidebar-search-input"
              placeholder="Your email address"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
            />
            <button type="submit" className="newsletter-btn">
              Subscribe
            </button>
          </form>
        ) : (
          <div className="text-center py-3 text-[var(--gold)] text-sm font-medium">
            <CheckCircle className="w-6 h-6 mx-auto mb-2" />
            <div>Subscribed! Welcome aboard.</div>
          </div>
        )}
      </div>
    </div>
  )
}
