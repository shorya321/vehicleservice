interface BoardHeadProps {
  id: string
  eyebrow: string
  title: string
  /** Replaces the default full-width container, e.g. when the head sits inside a column. */
  className?: string
}

/** Section header shared by the board sections: eyebrow over the h2. */
export function BoardHead({ id, eyebrow, title, className = 'luxury-container blog-board-head' }: BoardHeadProps) {
  return (
    <div className={className}>
      <div>
        <p className="blog-board-eyebrow"><i aria-hidden="true" />{eyebrow}</p>
        <h2 id={id} className="blog-board-h2">{title}</h2>
      </div>
    </div>
  )
}
