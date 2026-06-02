interface ContentSectionProps {
  title: string
  description?: string
  eyebrow?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function ContentSection({ title, description, eyebrow, action, children, className }: ContentSectionProps) {
  return (
    <section className={`account-section ${className ?? ""}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          {eyebrow && <span className="account-eyebrow">{eyebrow}</span>}
          <h2 className="account-section-title">{title}</h2>
          {description && <p className="account-section-desc">{description}</p>}
        </div>
        {action}
      </div>
      {!description && <div className="h-6" />}
      {children}
    </section>
  )
}
