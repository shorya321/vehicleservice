import { META_DESCRIPTION_LIMIT, META_TITLE_LIMIT } from '@/lib/seo/types'

interface SnippetPreviewProps {
  title: string
  description: string
  url: string
  noindex: boolean
}

function truncate(value: string, limit: number): string {
  return value.length > limit ? value.slice(0, limit).trimEnd() : value
}

/** Roughly how the page appears in Google results. Lengths are approximate. */
export function SnippetPreview({ title, description, url, noindex }: SnippetPreviewProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Google preview</p>
      {noindex ? (
        <p className="text-sm text-amber-500">Hidden from search results (noindex is on).</p>
      ) : (
        <div className="space-y-1">
          <p className="truncate text-xs text-muted-foreground">{url}</p>
          <p className="text-lg leading-snug text-[#8ab4f8]">{truncate(title, META_TITLE_LIMIT + 5)}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {truncate(description, META_DESCRIPTION_LIMIT)}
          </p>
        </div>
      )}
    </div>
  )
}
