import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  /** Accepted for call-site compatibility. Not rendered: the flow's register is
   *  typographic, and a 64px lucide glyph was the loudest thing on an empty tab. */
  icon?: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="mb-5 h-px w-8 bg-[var(--gold)]" aria-hidden="true" />
      <h3 className="text-[1.375rem] font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-2 max-w-sm text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
