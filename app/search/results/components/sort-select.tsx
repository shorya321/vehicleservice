'use client'

import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown } from 'lucide-react'

interface SortSelectProps<T extends string> {
  value: T
  options: readonly T[]
  labels: Record<T, string>
  onChange: (value: T) => void
  /** Text of the visible label beside the control, e.g. "Sort". */
  label: string
}

/**
 * Replaces the native <select> that used to sit here.
 *
 * A native select draws operating-system chrome in the middle of a bespoke
 * page, and its option list could only be coloured with hardcoded hexes that
 * ignored the theme. Radix gives a real menu with roving focus, typeahead and
 * escape handling, painted with the site's own tokens so it follows light and
 * dark for free.
 *
 * The primitive is imported directly rather than through components/ui, whose
 * wrapper hardcodes dark-only `luxury-*` colours that never flip.
 */
export function SortSelect<T extends string>({
  value,
  options,
  labels,
  onChange,
  label,
}: SortSelectProps<T>) {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger
        aria-label={`${label}: ${labels[value]}`}
        className="inline-flex h-11 min-w-[11rem] items-center justify-between gap-3 rounded-[4px] border border-[var(--graphite)] bg-[var(--charcoal)] px-4 text-[0.875rem] text-[var(--text-primary)] transition-colors duration-200 hover:border-[rgba(var(--gold-rgb),0.35)] focus-visible:outline-none focus-visible:border-[var(--gold)] focus-visible:ring-2 focus-visible:ring-[rgba(var(--gold-rgb),0.25)]"
      >
        {labels[value]}
        <ChevronDown
          className={`h-3.5 w-3.5 flex-none text-[var(--gold-text)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-[1001] min-w-[11rem] overflow-hidden rounded-[4px] border border-[var(--graphite)] bg-[var(--dropdown-surface)] p-1 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.6)]"
        >
          <DropdownMenu.RadioGroup
            value={value}
            onValueChange={(next) => onChange(next as T)}
          >
            {options.map((option) => (
              <DropdownMenu.RadioItem
                key={option}
                value={option}
                className="relative flex cursor-pointer select-none items-center gap-2 rounded-[3px] py-2 pl-8 pr-3 text-[0.875rem] text-[var(--text-secondary)] outline-none transition-colors data-[highlighted]:bg-[var(--dropdown-surface-hover)] data-[highlighted]:text-[var(--text-primary)] data-[state=checked]:text-[var(--gold-text)]"
              >
                <DropdownMenu.ItemIndicator className="absolute left-2.5 inline-flex">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </DropdownMenu.ItemIndicator>
                {labels[option]}
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
