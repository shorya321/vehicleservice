interface BoardHeadProps {
  id: string
  eyebrow: string
  title: string
  lede?: string
}

/** Section header shared by the board sections: eyebrow and h2 left, lede right. */
export function BoardHead({ id, eyebrow, title, lede }: BoardHeadProps) {
  return (
    <div className="luxury-container blog-board-head">
      <div>
        <p className="blog-board-eyebrow"><i aria-hidden="true" />{eyebrow}</p>
        <h2 id={id} className="blog-board-h2">{title}</h2>
      </div>
      {lede && <p className="blog-board-lede">{lede}</p>}
    </div>
  )
}
