import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FAQ_ITEMS } from "./faq-data"

// `import * as React` is for jest: ts-jest compiles JSX with the classic
// runtime, which needs React in scope. Next itself uses the automatic runtime.

interface FaqPanelProps {
  openIndex: number | null
  onToggle: (index: number) => void
}

/**
 * Markup only, so it renders under test. State and the reveal live in
 * ./faq.tsx. Every answer stays in the DOM so the open/close runs as a CSS
 * grid-rows transition; closed answers are `inert`, which takes them out of
 * the tab order and the accessibility tree. See `.faq-board` in
 * app/globals.css.
 */
export function FaqPanel({ openIndex, onToggle }: FaqPanelProps): React.JSX.Element {
  return (
    <div className="faq-board">
      <div>
        <div className="editorial-eyebrow faq-board__eyebrow">Asked</div>
        <h2 id="faq-heading" className="faq-board__title mt-5">
          Questions travellers actually ask.
        </h2>
        <p className="faq-board__body mt-[1.125rem]">
          If none of these covers it, our team replies within an hour during local
          business hours.
        </p>
        <Link href="/contact" className="btn btn-secondary faq-board__support">
          Write to support
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="faq-board__list">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index
          const triggerId = `faq-trigger-${index}`
          const contentId = `faq-content-${index}`

          return (
            <div key={item.question} className="faq-card" data-open={isOpen}>
              {/* Reset the base-layer h3, whose clamp() size, -0.02em
                  tracking and 1.15 leading otherwise inherit into the row. */}
              <h3 className="m-0 text-base font-normal leading-normal tracking-normal">
                <button
                  id={triggerId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  onClick={() => onToggle(index)}
                  className="faq-card__q"
                >
                  {item.question}
                  <span className="faq-card__marker" aria-hidden="true" />
                </button>
              </h3>
              <div
                id={contentId}
                role="region"
                aria-labelledby={triggerId}
                inert={!isOpen}
                className="faq-card__a"
              >
                <div>
                  <p>{item.answer}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
