"use client"
import { useState } from 'react'
import { Check, ChevronDown, Clock } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { HOURLY_PACKAGE_DEFAULTS, HOURLY_PACKAGE_LABELS } from '@/lib/trips/constants'
import { HOURLY_PACKAGES, type HourlyPackage } from '@/lib/trips/types'

interface HourlyPackageFieldProps {
  value: HourlyPackage
  onChange: (value: HourlyPackage) => void
}

/** Half day or full day, styled as the bar's other popover cells (date, guests). */
export function HourlyPackageField({ value, onChange }: HourlyPackageFieldProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="search-bar-field search-bar-field--compact">
      <label htmlFor="hourly-package" className="search-bar-label">Duration</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id="hourly-package"
            type="button"
            className="search-bar-input search-bar-date-trigger"
            aria-label={`Duration, ${HOURLY_PACKAGE_LABELS[value]}`}
          >
            <Clock className="w-4 h-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
            <span className="min-w-0 truncate">{HOURLY_PACKAGE_LABELS[value]}</span>
            <ChevronDown className="search-bar-chevron w-4 h-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent className="luxury-calendar-popover w-72 p-2" align="start" sideOffset={8}>
          <ul role="listbox" aria-label="Hourly package" className="space-y-1">
            {HOURLY_PACKAGES.map((pkg) => (
              <li key={pkg} role="option" aria-selected={pkg === value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(pkg)
                    setOpen(false)
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-[var(--charcoal)]"
                >
                  <span>
                    <span className="block text-sm font-medium text-[var(--text-primary)]">
                      {HOURLY_PACKAGE_LABELS[pkg]}
                    </span>
                    <span className="block text-xs text-[var(--text-muted)]">
                      About {HOURLY_PACKAGE_DEFAULTS[pkg].hours} hours with your chauffeur
                    </span>
                  </span>
                  {pkg === value && <Check className="h-4 w-4 text-[var(--gold-text)]" aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  )
}
