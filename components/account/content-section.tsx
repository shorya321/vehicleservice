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
      {/* .account-section-header owns the space below the header, so a section
          without a description no longer needs a hardcoded spacer div. */}
      <div className="account-section-header flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          {eyebrow && <span className="account-eyebrow">{eyebrow}</span>}
          <h2 className="account-section-title">{title}</h2>
          {description && <p className="account-section-desc">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
