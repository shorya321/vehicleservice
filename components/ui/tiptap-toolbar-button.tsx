'use client'

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  title: string
  disabled?: boolean
  children: React.ReactNode
}

export function ToolbarButton({ onClick, isActive = false, title, disabled = false, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`p-1.5 rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50 ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

export function ToolbarSeparator() {
  return <div className="w-px h-6 bg-border mx-1" />
}
