import { Metadata } from 'next'
import { TermsHero } from './components/terms-hero'
import { TermsContent } from './components/terms-content'
import { TableOfContents, type TocSection } from '@/components/legal/table-of-contents'

const LAST_UPDATED = '1 July 2026'

const sections: TocSection[] = [
  { id: 'introduction-and-acceptance', title: 'Introduction and acceptance' },
  { id: 'definitions', title: 'Definitions' },
  { id: 'account-registration', title: 'Account registration' },
  { id: 'booking-and-payment', title: 'Booking and payment' },
  { id: 'cancellation-and-refund', title: 'Cancellation and refund' },
  { id: 'service-delivery', title: 'Service delivery' },
  { id: 'user-responsibilities', title: 'User responsibilities' },
  { id: 'vehicle-provider-terms', title: 'Vehicle provider terms' },
  { id: 'intellectual-property', title: 'Intellectual property' },
  { id: 'limitation-of-liability', title: 'Limitation of liability' },
  { id: 'indemnification', title: 'Indemnification' },
  { id: 'governing-law-and-disputes', title: 'Governing law and disputes' },
  { id: 'modifications', title: 'Modifications' },
  { id: 'contact-information', title: 'Contact information' },
]

export const metadata: Metadata = {
  title: 'Terms & Conditions | Infinia Transfers',
  description:
    'Terms of service for booking private airport and city transfers through Infinia Transfers.',
  openGraph: {
    title: 'Terms & Conditions | Infinia Transfers',
    description:
      'Terms of service for booking transfers through Infinia Transfers.',
  },
}

export default function TermsPage() {
  return (
    <>
      <TermsHero lastUpdated={LAST_UPDATED} />

      <section className="py-10 md:py-16 bg-[var(--black-rich)] border-t border-[var(--graphite)]">
        <div className="luxury-container">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 lg:gap-12">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <TableOfContents sections={sections} />
            </aside>
            <div className="prose-luxury max-w-3xl">
              <TermsContent />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
