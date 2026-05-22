interface ContentSectionProps {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function ContentSection({ title, description, action, children, className }: ContentSectionProps) {
  return (
    <section className={`account-section ${className ?? ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
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
