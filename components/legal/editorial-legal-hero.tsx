// `import * as React` is for jest: ts-jest compiles JSX with the classic runtime.
import * as React from 'react'
import Link from 'next/link'
import { CalendarDays, Clock, Mail } from 'lucide-react'
import type { LegalContent } from '@/lib/cms/templates/legal/schema'

/** "Cancellation & Refund Policy" -> ["Cancellation & Refund", "Policy"], the last word in gold. */
function splitTitle(title: string): [string, string] {
  const trimmed = title.trim()
  const cut = trimmed.lastIndexOf(' ')
  return cut === -1 ? ['', trimmed] : [trimmed.slice(0, cut), trimmed.slice(cut + 1)]
}

interface EditorialLegalHeroProps {
  hero: LegalContent['hero']
  lastUpdated: string
  minutes: number
  supportEmail: string
}

/** Breadcrumb, eyebrow, split title and meta on the left; intro and support inbox in a card. */
export function EditorialLegalHero({ hero, lastUpdated, minutes, supportEmail }: EditorialLegalHeroProps): React.JSX.Element {
  const [lead, accent] = splitTitle(hero.title)

  return (
    <section className="pt-12 pb-12 md:pt-16 md:pb-16 bg-[var(--black-void)]">
      <div className="luxury-container">
        <nav aria-label="Breadcrumb" className="text-[0.8125rem] text-[var(--text-muted)]">
          <Link href="/" className="hover:text-[var(--text-secondary)] transition-colors">Home</Link>
          <span aria-hidden="true" className="mx-2">/</span>
          <span aria-current="page" className="text-[var(--gold-text)]">{hero.title}</span>
        </nav>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div>
            <p className="text-[0.75rem] font-medium uppercase tracking-[0.24em] text-[var(--gold-text)]">
              {hero.eyebrow}
            </p>
            <h1 className="mt-5 text-[clamp(2.25rem,5vw,3.5rem)] font-normal leading-[1.05] tracking-[-0.02em] text-[var(--text-primary)] [text-wrap:balance]">
              {lead && <>{lead} </>}
              <span className="text-[var(--gold-text)]">{accent}</span>
            </h1>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[0.8125rem] text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Last updated: {lastUpdated}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {minutes} min read
              </span>
            </div>
          </div>

          {(hero.intro || supportEmail) && (
            <div className="border border-[var(--graphite)] bg-[rgba(var(--gold-rgb),0.03)] p-6 md:p-8">
              {hero.intro && (
                <p className="text-[0.9375rem] leading-relaxed text-[var(--text-secondary)] [text-wrap:pretty]">
                  {hero.intro}
                </p>
              )}
              {supportEmail && (
                <a
                  href={`mailto:${supportEmail}`}
                  className={`flex items-center gap-2.5 text-[0.875rem] text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] transition-colors ${
                    hero.intro ? 'mt-6 border-t border-[var(--graphite)] pt-5' : ''
                  }`}
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {supportEmail}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
