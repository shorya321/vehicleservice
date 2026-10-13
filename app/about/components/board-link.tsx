import { ArrowUpRight } from 'lucide-react'
import { CmsLink } from '@/components/cms/cms-link'
import type { Cta } from '@/lib/cms/fields'

/** The blog board's pill button with its trailing arrow chip. */
export function BoardLink({ cta, ghost = false }: { cta: Cta; ghost?: boolean }) {
  return (
    <CmsLink href={cta.href} className={ghost ? 'blog-board-btn blog-board-btn--ghost' : 'blog-board-btn'}>
      {cta.label}
      <span className="blog-board-btn__ic" aria-hidden="true">
        <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
      </span>
    </CmsLink>
  )
}
