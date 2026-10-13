'use client'

import { useState } from 'react'
import { Highlight } from './highlight'

interface FaqItemProps {
  id: string
  question: string
  answer: string
  term: string
}

/** One question on the .faq-card accordion used by Home and Contact. */
export function FaqItem({ id, question, answer, term }: FaqItemProps) {
  const [open, setOpen] = useState(false)
  const triggerId = `${id}-q`
  const answerId = `${id}-a`

  return (
    <div className="faq-card" data-open={open}>
      <h3 className="m-0 text-base font-normal leading-normal tracking-normal">
        <button
          id={triggerId}
          type="button"
          onClick={() => setOpen(!open)}
          className="faq-card__q"
          aria-expanded={open}
          aria-controls={answerId}
        >
          <Highlight text={question} term={term} />
          <span className="faq-card__marker" aria-hidden="true" />
        </button>
      </h3>
      <div id={answerId} role="region" aria-labelledby={triggerId} inert={!open} className="faq-card__a">
        <div>
          <p><Highlight text={answer} term={term} /></p>
        </div>
      </div>
    </div>
  )
}
