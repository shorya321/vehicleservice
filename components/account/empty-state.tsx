import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="py-16 flex flex-col items-center text-center">
      <Icon className="w-16 h-16 text-[var(--text-muted)] mb-4" strokeWidth={1.5} aria-hidden="true" />
      <div className="w-8 h-px bg-[var(--gold)] mb-5" aria-hidden="true" />
      <h3 className="text-[1.375rem] font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-[0.9375rem] text-[var(--text-muted)] max-w-sm leading-relaxed">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
