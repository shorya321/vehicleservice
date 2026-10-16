'use client'

import * as React from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FilterToggleProps {
  /** How many filters are set. Shown on the button, and opens the panel when above 0. */
  activeCount?: number
  /** Optional heading block shown to the left of the button. */
  header?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/**
 * Show / Hide Filters button that shows or hides the filters it wraps. It only
 * changes visibility: the filters inside keep their own state and URL logic,
 * and stay mounted while hidden so a pending debounce still lands.
 */
export function FilterToggle({ activeCount = 0, header, children, className }: FilterToggleProps): React.JSX.Element {
  const [open, setOpen] = React.useState(activeCount > 0)
  const panelId = React.useId()

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        {header ?? <span />}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('h-9 gap-2 px-3', open && 'border-primary text-primary')}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {open ? 'Hide Filters' : 'Show Filters'}
          {activeCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-[11px] font-bold leading-[18px] text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </div>
      <div id={panelId} hidden={!open}>
        {children}
      </div>
    </div>
  )
}
