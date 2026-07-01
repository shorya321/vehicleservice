import { Metadata } from 'next'
import { PrivacyHero } from './components/privacy-hero'
import { PrivacyContent } from './components/privacy-content'
import { TableOfContents, type TocSection } from '@/components/legal/table-of-contents'

const LAST_UPDATED = '1 July 2026'

const sections: TocSection[] = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'information-we-collect', title: 'Information we collect' },
  { id: 'how-we-use-your-information', title: 'How we use your information' },
  { id: 'information-sharing', title: 'Information sharing' },
  { id: 'data-retention', title: 'Data retention' },
  { id: 'your-rights', title: 'Your rights' },
  { id: 'cookies-and-tracking', title: 'Cookies and tracking' },
  { id: 'international-data-transfers', title: 'International data transfers' },
  { id: 'childrens-privacy', title: "Children's privacy" },
  { id: 'security-measures', title: 'Security measures' },
  { id: 'changes-to-this-policy', title: 'Changes to this policy' },
  { id: 'contact-us', title: 'Contact us' },
]

export const metadata: Metadata = {
  title: 'Privacy Policy | Infinia Transfers',
  description:
    'How Infinia Transfers collects, uses, and protects your personal data when you book private airport and city transfers.',
  openGraph: {
    title: 'Privacy Policy | Infinia Transfers',
    description:
      'How Infinia Transfers collects, uses, and protects your personal data.',
  },
}

export default function PrivacyPage() {
  return (
    <>
      <PrivacyHero lastUpdated={LAST_UPDATED} />

      <section className="py-10 md:py-16 bg-[var(--black-rich)] border-t border-[var(--graphite)]">
        <div className="luxury-container">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 lg:gap-12">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <TableOfContents sections={sections} />
            </aside>
            <div className="prose-luxury max-w-3xl">
              <PrivacyContent />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
