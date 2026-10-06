'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { CmsLink } from '@/components/cms/cms-link'
import type { ContactContent } from '@/lib/cms/templates/contact/schema'

export function ContactFaq({ content }: { content: ContactContent['faq'] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="faq-board">
      <div>
        <div className="editorial-eyebrow editorial-eyebrow--pill faq-board__eyebrow"><i aria-hidden="true" />{content.eyebrow}</div>
        <h2 id="contact-faq-heading" className="editorial-section-title mt-5">
          {content.title}
        </h2>
        {content.body && <p className="faq-board__body mt-[1.125rem]">{content.body}</p>}
        <CmsLink href={content.cta.href} className="btn btn-secondary faq-board__support">
          {content.cta.label}
          <ArrowRight className="w-4 h-4" />
        </CmsLink>
      </div>

      <div className="faq-board__list">
        {content.items.map((faq, index) => {
          const isOpen = openIndex === index
          const triggerId = `faq-trigger-${index}`
          const answerId = `faq-answer-${index}`

          return (
            <div key={index} className="faq-card" data-open={isOpen}>
              <h3 className="m-0 text-base font-normal leading-normal tracking-normal">
                <button
                  id={triggerId}
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="faq-card__q"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                >
                  {faq.question}
                  <span className="faq-card__marker" aria-hidden="true" />
                </button>
              </h3>
              <div
                id={answerId}
                role="region"
                aria-labelledby={triggerId}
                inert={!isOpen}
                className="faq-card__a"
              >
                <div>
                  <p>{faq.answer}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
