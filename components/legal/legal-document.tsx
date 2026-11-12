// `import * as React` is for jest: ts-jest compiles JSX with the classic runtime.
import * as React from 'react'
import { TableOfContents } from '@/components/legal/table-of-contents'
import { sanitizeRichText } from '@/lib/cms/sanitize'
import { fillSettingsPlaceholders } from '@/lib/cms/placeholders'
import type { LegalContent } from '@/lib/cms/templates/legal/schema'

/** Registered company shown under the text. Built from Settings > General. */
export interface LegalCompanyBlock {
  legalName: string
  licence: string
  address: string
}

const COMPANY_SECTION_ID = 'company-details'

/**
 * Terms and Privacy share one shape: a hero with the last-updated line, then
 * a sticky contents list beside the sections. Markup and classes are the ones
 * the two pages used before they became editable.
 */
export function LegalDocument({
  content,
  company = null,
  supportEmail = '',
}: {
  content: LegalContent
  /** Null, or no legal name and no licence, renders the page exactly as before. */
  company?: LegalCompanyBlock | null
  /** Settings > General support email, filled into `{{support_email}}` in the text. */
  supportEmail?: string
}): React.JSX.Element {
  // Skipped if an editor already used the id, so the page never has two.
  const companyBlock =
    company &&
    (company.legalName || company.licence) &&
    !content.sections.some((section) => section.id === COMPANY_SECTION_ID)
      ? company
      : null
  const toc = [
    ...content.sections.map((section) => ({ id: section.id, title: section.toc_label })),
    ...(companyBlock ? [{ id: COMPANY_SECTION_ID, title: 'Company details' }] : []),
  ]

  return (
    <>
      <section className="pt-16 pb-10 md:pt-20 md:pb-12 bg-[var(--black-void)]">
        <div className="luxury-container">
          <div className="w-10 h-px bg-[var(--gold)] mb-5" aria-hidden="true" />
          <p className="text-[0.75rem] font-medium tracking-[0.16em] uppercase text-[var(--gold-text)] mb-4">
            {content.hero.eyebrow}
          </p>
          <h1 className="text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--text-primary)] mb-4 [text-wrap:balance]">
            {content.hero.title}
          </h1>
          {content.hero.intro && (
            <p className="text-[0.9375rem] leading-relaxed tracking-[0.01em] text-[var(--text-secondary)] max-w-xl [text-wrap:pretty]">
              {content.hero.intro}
            </p>
          )}
          <p className="mt-6 text-[0.8125rem] tracking-[0.01em] text-[var(--text-muted)]">
            Last updated: {content.last_updated}
          </p>
        </div>
      </section>

      <section className="py-10 md:py-16 bg-[var(--black-rich)] border-t border-[var(--graphite)]">
        <div className="luxury-container">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 lg:gap-12">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <TableOfContents sections={toc} />
            </aside>
            <div className="prose-luxury max-w-3xl">
              {content.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-28">
                  <h2>{section.title}</h2>
                  <div dangerouslySetInnerHTML={{ __html: sanitizeRichText(fillSettingsPlaceholders(section.body, { supportEmail })) }} />
                </section>
              ))}
              {companyBlock && (
                <section id={COMPANY_SECTION_ID} className="scroll-mt-28">
                  <h2>Company details</h2>
                  <ul>
                    {companyBlock.legalName && (
                      <li><strong>Legal name:</strong> {companyBlock.legalName}</li>
                    )}
                    {companyBlock.licence && (
                      <li><strong>Trade licence:</strong> {companyBlock.licence}</li>
                    )}
                    {companyBlock.address && (
                      <li><strong>Registered office:</strong> {companyBlock.address}</li>
                    )}
                  </ul>
                </section>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
