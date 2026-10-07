interface FieldGroupProps {
  title: string
  hint: string
  children: React.ReactNode
}

/** A titled block of SEO fields, so search, social and advanced settings read apart. */
export function FieldGroup({ title, hint, children }: FieldGroupProps) {
  return (
    <section className="space-y-5">
      <div className="space-y-1 border-b pb-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {children}
    </section>
  )
}
