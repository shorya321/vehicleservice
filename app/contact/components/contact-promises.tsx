interface PromiseStep {
  index: string
  title: string
  body: string
  foot: string
}

const promises: PromiseStep[] = [
  {
    index: '01',
    title: 'It lands with a person.',
    body: 'Messages go to the concierge desk in Business Bay, not a shared inbox that nobody owns.',
    foot: 'Business Bay, Dubai',
  },
  {
    index: '02',
    title: 'You get an answer within 24 hours.',
    body: 'Most land the same hour during Dubai business hours. Anything urgent gets picked up by phone.',
    foot: 'Within 24 hours',
  },
  {
    index: '03',
    title: 'Your booking is confirmed in writing.',
    body: 'Changes to pickup time, vehicle class or passenger count are confirmed by email before we move.',
    foot: 'Confirmed by email',
  },
]

export function ContactPromises() {
  return (
    <section
      aria-labelledby="contact-promises-heading"
      className="editorial-section editorial-section--ground editorial-section--compact"
    >
      <div className="luxury-container">
        <header className="max-w-2xl">
          <p className="editorial-eyebrow editorial-eyebrow--pill"><i aria-hidden="true" />After you write</p>
          <h2 id="contact-promises-heading" className="editorial-section-title mt-5">
            Three steps, then it is handled.
          </h2>
        </header>

        <ol className="mt-12 grid list-none grid-cols-1 gap-5 p-0 min-[900px]:grid-cols-3">
          {promises.map((promise) => (
            <li key={promise.index} className="promise-card">
              <span className="promise-card__index numeric">{promise.index}</span>
              <h3 className="editorial-list-title">{promise.title}</h3>
              <p className="editorial-list-body">{promise.body}</p>
              <span className="promise-card__foot editorial-list-meta">{promise.foot}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
