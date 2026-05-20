export function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const CATEGORY_COLORS: Record<string, string> = {
  'travel-tips': 'blog-cat--warm',
  'destination-guides': 'blog-cat--sage',
  'luxury-lifestyle': 'blog-cat--rose',
  'industry-news': 'blog-cat--slate',
}

export function getCategoryClass(slug: string | undefined): string {
  if (!slug) return 'blog-cat--gold'
  return CATEGORY_COLORS[slug] ?? 'blog-cat--gold'
}

export function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
