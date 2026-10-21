interface ServicesHeadProps {
  id: string
  eyebrow: string
  title: string
}

/** Board section header: eyebrow over the h2. */
export function ServicesHead({ id, eyebrow, title }: ServicesHeadProps) {
  return (
    <div className="luxury-container blog-board-head">
      <div>
        <p className="blog-board-eyebrow"><i aria-hidden="true" />{eyebrow}</p>
        <h2 id={id} className="blog-board-h2">{title}</h2>
      </div>
    </div>
  )
}
