import type { FaqContent } from '@/lib/cms/templates/faq/schema'
import { BoardLink } from '@/app/about/components/board-link'

export const FAQ_HELP_ID = 'faq-help'

interface FaqHelpProps {
  content: FaqContent['help']
  /** Support email from Settings, General; omitted when empty. */
  email: string
}

/** Closing panel, the blog's close plate with contact facts in place of photos. */
export function FaqHelp({ content, email }: FaqHelpProps) {
  const facts = [
    { label: 'Replies', value: content.replies },
    { label: 'Hours', value: content.hours },
    { label: 'Email', value: email },
  ].filter((fact) => fact.value)

  return (
    <section id={FAQ_HELP_ID} aria-labelledby="faq-help-heading" className="luxury-container blog-board-close-sec faq-page__help">
      <div className="blog-board-bezel blog-board-close">
        <div className="blog-board-core blog-board-close__core">
          <div>
            <p className="blog-board-eyebrow"><i aria-hidden="true" />{content.eyebrow}</p>
            <h2 id="faq-help-heading" className="blog-board-close__title">{content.title}</h2>
            <div className="blog-board-close__acts faq-page__help-acts">
              <BoardLink cta={content.primary} />
              <BoardLink cta={content.secondary} ghost />
            </div>
          </div>
          {facts.length > 0 && (
            <dl className="faq-page__facts">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd className="numeric">{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  )
}
