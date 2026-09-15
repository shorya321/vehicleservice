import * as React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { ZoneNetwork } from './zone-network'

// `import * as React` is for jest: ts-jest compiles JSX with the classic
// runtime, which needs React in scope. Next itself uses the automatic runtime.

/**
 * Markup only, so it renders under test. Every claim here is something the
 * account booking page (/account/bookings/[reference]) actually shows: the
 * reference, the assigned chauffeur's name, phone and plate, and the invoice.
 * Do not add live tracking or rescheduling; customers have neither.
 */
export function AfterYouBookPlate(): React.JSX.Element {
  return (
    <div className="after-book-plate">
      <div className="after-book-plate__field" aria-hidden="true" />

      <div className="after-book-plate__copy">
        <span className="after-book-plate__eyebrow">
          <i aria-hidden="true" />
          After you book
        </span>
        <h2 id="after-you-book-heading" className="editorial-section-title after-book-plate__title">
          Booked. Then it all lives on one page.
        </h2>
        <p className="after-book-plate__body">
          Your reference, your chauffeur&apos;s name, phone and plate, and your
          invoice. All in your account, from confirmation to kerbside.
        </p>
        <div className="after-book-plate__actions">
          <a href="#hero" className="btn btn-primary">
            Book a transfer
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <Link href="/account?tab=bookings" className="after-book-plate__quiet">
            Manage a booking
          </Link>
        </div>
      </div>

      <ZoneNetwork />
    </div>
  )
}
