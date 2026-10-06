import type { ContactContent } from '@/lib/cms/templates/contact/schema'

export function ContactPromises({ content }: { content: ContactContent['promises'] }) {
  return (
    <section
      aria-labelledby="contact-promises-heading"
      className="editorial-section editorial-section--ground editorial-section--compact"
    >
      <div className="luxury-container">
        <header className="max-w-2xl">
          <p className="editorial-eyebrow editorial-eyebrow--pill"><i aria-hidden="true" />{content.eyebrow}</p>
          <h2 id="contact-promises-heading" className="editorial-section-title mt-5">
            {content.title}
          </h2>
        </header>

        <ol className="mt-12 grid list-none grid-cols-1 gap-5 p-0 min-[900px]:grid-cols-3">
          {content.items.map((promise, index) => (
            <li key={index} className="promise-card">
              <span className="promise-card__index numeric">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="editorial-list-title">{promise.title}</h3>
              <p className="editorial-list-body">{promise.body}</p>
              {promise.meta && <span className="promise-card__foot editorial-list-meta">{promise.meta}</span>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
