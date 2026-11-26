// `import * as React` is for jest: ts-jest compiles JSX with the classic runtime.
import * as React from 'react'
import Link from 'next/link'
import { FileText, HelpCircle, Mail, ReceiptText, ShieldCheck } from 'lucide-react'
import { TableOfContents } from '@/components/legal/table-of-contents'
import { NumberedLegalSection } from '@/components/legal/numbered-legal-section'
import { EditorialLegalHero } from '@/components/legal/editorial-legal-hero'
import type { LegalCompanyBlock } from '@/components/legal/legal-document'
import { sanitizeRichText } from '@/lib/cms/sanitize'
import { fillSettingsPlaceholders } from '@/lib/cms/placeholders'
import type { LegalContent } from '@/lib/cms/templates/legal/schema'

const WORDS_PER_MINUTE = 220
const COMPANY_SECTION_ID = 'company-details'

const QUICK_LINKS = [
  { href: '/terms', label: 'Terms & Conditions', Icon: FileText },
  { href: '/privacy', label: 'Privacy Policy', Icon: ShieldCheck },
  { href: '/refund', label: 'Cancellation & Refund Policy', Icon: ReceiptText },
  { href: '/faq', label: 'Frequently Asked Questions', Icon: HelpCircle },
  { href: '/contact', label: 'Contact Support', Icon: Mail },
] as const

function readMinutes(htmlBodies: string[]): number {
  const words = htmlBodies.join(' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

interface EditorialLegalDocumentProps {
  content: LegalContent
  /** Settings > General support email, filled into `{{support_email}}` and shown in the hero. */
  supportEmail: string
  /** The page's own path, left out of the quick links. */
  currentPath: string
  /** Shown as a final numbered section once a legal name or licence is set. */
  company?: LegalCompanyBlock | null
}

/**
 * Terms, Privacy and Refund: an editorial hero with the support inbox beside it, a numbered
 * contents rail with quick links, and numbered sections. Copy comes from Admin > Pages.
 * The vendor agreement keeps the plain LegalDocument.
 */
export function EditorialLegalDocument({
  content,
  supportEmail,
  currentPath,
  company = null,
}: EditorialLegalDocumentProps): React.JSX.Element {
  const sections = content.sections.map((section) => ({
    ...section,
    html: sanitizeRichText(fillSettingsPlaceholders(section.body, { supportEmail })),
  }))
  // Skipped if an editor already used the id, so the page never has two.
  const companyBlock =
    company && (company.legalName || company.licence) && !sections.some((s) => s.id === COMPANY_SECTION_ID)
      ? company
      : null
  const toc = [
    ...sections.map((s) => ({ id: s.id, title: s.toc_label })),
    ...(companyBlock ? [{ id: COMPANY_SECTION_ID, title: 'Company details' }] : []),
  ]
  const quickLinks = QUICK_LINKS.filter((link) => link.href !== currentPath)

  return (
    <>
      <EditorialLegalHero
        hero={content.hero}
        lastUpdated={content.last_updated}
        minutes={readMinutes(sections.map((s) => s.html))}
        supportEmail={supportEmail}
      />

      <section className="py-12 md:py-20 bg-[var(--black-rich)] border-t border-[var(--graphite)]">
        <div className="luxury-container">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 lg:gap-16">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <TableOfContents sections={toc} numbered heading="Table of contents" />
              <div className="hidden lg:block mt-10 border-t border-[var(--graphite)] pt-8">
                <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)] mb-4">
                  Quick links
                </p>
                <ul className="space-y-3">
                  {quickLinks.map(({ href, label, Icon }) => (
                    <li key={href}>
                      <Link href={href} className="inline-flex items-center gap-2.5 text-[0.8125rem] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            <div className="max-w-3xl space-y-14 md:space-y-16">
              {sections.map((section, index) => (
                <NumberedLegalSection key={section.id} id={section.id} index={index} title={section.title} html={section.html} />
              ))}
              {companyBlock && (
                <NumberedLegalSection id={COMPANY_SECTION_ID} index={sections.length} title="Company details">
                  <ul>
                    {companyBlock.legalName && <li><strong>Legal name:</strong> {companyBlock.legalName}</li>}
                    {companyBlock.licence && <li><strong>Trade licence:</strong> {companyBlock.licence}</li>}
                    {companyBlock.address && <li><strong>Registered office:</strong> {companyBlock.address}</li>}
                  </ul>
                </NumberedLegalSection>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
