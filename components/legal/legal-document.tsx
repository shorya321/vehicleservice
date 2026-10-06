import { TableOfContents } from '@/components/legal/table-of-contents'
import { sanitizeRichText } from '@/lib/cms/sanitize'
import type { LegalContent } from '@/lib/cms/templates/legal/schema'

/**
 * Terms and Privacy share one shape: a hero with the last-updated line, then
 * a sticky contents list beside the sections. Markup and classes are the ones
 * the two pages used before they became editable.
 */
export function LegalDocument({ content }: { content: LegalContent }) {
  const toc = content.sections.map((section) => ({ id: section.id, title: section.toc_label }))

  return (
    <>
      <section className="pt-16 pb-10 md:pt-20 md:pb-12 bg-[var(--black-void)]">
        <div className="luxury-container">
          <div className="w-10 h-px bg-[var(--gold)] mb-5" aria-hidden="true" />
          <p className="text-[0.75rem] font-medium tracking-[0.16em] uppercase text-[var(--gold-text)] mb-4">
            {content.hero.eyebrow}
          </p>
          <h1 className="text-[clamp(2.5rem,5vw,3.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--text-primary)] mb-4 [text-wrap:balance]">
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
                  <div dangerouslySetInnerHTML={{ __html: sanitizeRichText(section.body) }} />
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
