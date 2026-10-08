import { Plus } from 'lucide-react'
import { FAQ_ANCHOR, type BlogFaq } from '@/lib/blog/sections'

interface ArticleFaqProps {
  faqs: BlogFaq[]
}

/** Closing FAQ accordion. Same items feed the page's FAQPage structured data. */
export function ArticleFaq({ faqs }: ArticleFaqProps) {
  if (faqs.length === 0) return null

  return (
    <section id={FAQ_ANCHOR} aria-labelledby="article-faq-h" className="article-faq">
      <h2 id="article-faq-h" className="article-faq__title">
        Frequently asked questions
      </h2>
      <div className="article-faq__list">
        {faqs.map((faq, i) => (
          <details key={i} className="article-faq__item" open={i === 0}>
            <summary className="article-faq__q">
              <h3>{faq.question}</h3>
              <Plus className="article-faq__icon h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            </summary>
            <p className="article-faq__a">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
