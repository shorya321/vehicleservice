// `import * as React` is for jest: ts-jest compiles JSX with the classic runtime.
import * as React from 'react'
import Link from 'next/link'
import { CalendarDays, Clock, FileText, HelpCircle, Mail, ShieldCheck } from 'lucide-react'
import { TableOfContents } from '@/components/legal/table-of-contents'
import { NumberedLegalSection } from '@/components/legal/numbered-legal-section'
import type { LegalCompanyBlock } from '@/components/legal/legal-document'
import { sanitizeRichText } from '@/lib/cms/sanitize'
import { fillSettingsPlaceholders } from '@/lib/cms/placeholders'
import type { LegalContent } from '@/lib/cms/templates/legal/schema'

const WORDS_PER_MINUTE = 220

const QUICK_LINKS = [
  { href: '/terms', label: 'Terms & Conditions', Icon: FileText },
  { href: '/privacy', label: 'Privacy Policy', Icon: ShieldCheck },
  { href: '/faq', label: 'Frequently Asked Questions', Icon: HelpCircle },
  { href: '/contact', label: 'Contact Support', Icon: Mail },
] as const

function readMinutes(htmlBodies: string[]): number {
  const words = htmlBodies.join(' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

/** "Cancellation & Refund Policy" -> ["Cancellation & Refund", "Policy"], the last word in gold. */
function splitTitle(title: string): [string, string] {
  const cut = title.trim().lastIndexOf(' ')
  return cut === -1 ? ['', title] : [title.slice(0, cut), title.slice(cut + 1)]
}

interface RefundDocumentProps {
  content: LegalContent
  supportEmail: string
  company?: LegalCompanyBlock | null
}

/**
 * The refund policy page: an editorial hero with the support inbox beside it, a numbered
 * contents rail with quick links, and numbered sections. Copy comes from Admin > Pages.
 */
export function RefundDocument({ content, supportEmail, company = null }: RefundDocumentProps): React.JSX.Element {
  const sections = content.sections.map((section) => ({
    ...section,
    html: sanitizeRichText(fillSettingsPlaceholders(section.body, { supportEmail })),
  }))
  const [lead, accent] = splitTitle(content.hero.title)
  const minutes = readMinutes(sections.map((s) => s.html))
  const companyLine = company ? [company.legalName, company.licence && `Trade licence ${company.licence}`].filter(Boolean).join(' · ') : ''

  return (
    <>
      <section className="pt-12 pb-12 md:pt-16 md:pb-16 bg-[var(--black-void)]">
        <div className="luxury-container">
          <nav aria-label="Breadcrumb" className="text-[0.8125rem] text-[var(--text-muted)]">
            <Link href="/" className="hover:text-[var(--text-secondary)] transition-colors">Home</Link>
            <span aria-hidden="true" className="mx-2">/</span>
            <span aria-current="page" className="text-[var(--gold-text)]">{content.hero.title}</span>
          </nav>

          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 lg:items-center">
            <div>
              <p className="text-[0.75rem] font-medium uppercase tracking-[0.24em] text-[var(--gold-text)]">
                {content.hero.eyebrow}
              </p>
              <h1 className="mt-5 text-[clamp(2.25rem,5vw,3.75rem)] font-normal leading-[1.05] tracking-[-0.02em] text-[var(--text-primary)] [text-wrap:balance]">
                {lead && <>{lead} </>}
                <span className="italic text-[var(--gold-text)]">{accent}</span>
              </h1>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[0.8125rem] text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Last updated: {content.last_updated}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {minutes} min read
                </span>
              </div>
            </div>

            <div className="border border-[var(--graphite)] bg-[rgba(var(--gold-rgb),0.03)] p-6 md:p-8">
              {content.hero.intro && (
                <p className="text-[0.9375rem] leading-relaxed text-[var(--text-secondary)] [text-wrap:pretty]">
                  {content.hero.intro}
                </p>
              )}
              {supportEmail && (
                <a
                  href={`mailto:${supportEmail}`}
                  className="mt-6 flex items-center gap-2.5 border-t border-[var(--graphite)] pt-5 text-[0.875rem] text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] transition-colors"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {supportEmail}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 bg-[var(--black-rich)] border-t border-[var(--graphite)]">
        <div className="luxury-container">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 lg:gap-16">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <TableOfContents sections={sections.map((s) => ({ id: s.id, title: s.toc_label }))} numbered heading="Table of contents" />
              <div className="hidden lg:block mt-10 border-t border-[var(--graphite)] pt-8">
                <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)] mb-4">
                  Quick links
                </p>
                <ul className="space-y-3">
                  {QUICK_LINKS.map(({ href, label, Icon }) => (
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
              {companyLine && (
                <p className="border-t border-[var(--graphite)] pt-6 text-[0.8125rem] text-[var(--text-muted)]">
                  {companyLine}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
