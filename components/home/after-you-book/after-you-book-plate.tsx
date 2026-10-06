import * as React from 'react'
import { ArrowUpRight } from 'lucide-react'
import { ZoneNetwork } from './zone-network'
import { CmsLink } from '@/components/cms/cms-link'
import type { HomeContent } from '@/lib/cms/templates/home/schema'

// `import * as React` is for jest: ts-jest compiles JSX with the classic
// runtime, which needs React in scope. Next itself uses the automatic runtime.

/**
 * Markup only, so it renders under test. Every claim here is something the
 * account booking page (/account/bookings/[reference]) actually shows: the
 * reference, the assigned chauffeur's name, phone and plate, and the invoice.
 * Do not add live tracking or rescheduling; customers have neither.
 */
interface AfterYouBookPlateProps {
  content: HomeContent['after_you_book']
}

export function AfterYouBookPlate({ content }: AfterYouBookPlateProps): React.JSX.Element {
  return (
    <div className="after-book-plate">
      <div className="after-book-plate__field" aria-hidden="true" />

      <div className="after-book-plate__copy">
        <span className="after-book-plate__eyebrow">
          <i aria-hidden="true" />
          {content.eyebrow}
        </span>
        <h2 id="after-you-book-heading" className="editorial-section-title after-book-plate__title">
          {content.title}
        </h2>
        {content.body && <p className="after-book-plate__body">{content.body}</p>}
        <div className="after-book-plate__actions">
          <CmsLink href={content.primary_cta.href} className="btn btn-primary">
            {content.primary_cta.label}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </CmsLink>
          <CmsLink href={content.secondary_cta.href} className="after-book-plate__quiet">
            {content.secondary_cta.label}
          </CmsLink>
        </div>
      </div>

      <ZoneNetwork />
    </div>
  )
}
