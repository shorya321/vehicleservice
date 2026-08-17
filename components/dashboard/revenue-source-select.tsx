'use client'

import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DEFAULT_REVENUE_SOURCE, type RevenueSource } from '@/lib/dashboard/revenue-range'

interface RevenueSourceSelectProps {
  source: RevenueSource
}

const SOURCE_OPTIONS: Array<{ value: RevenueSource; label: string }> = [
  { value: 'all', label: 'All bookings' },
  { value: 'customer', label: 'Customer' },
  { value: 'business', label: 'Business' },
]

export function RevenueSourceSelect({ source }: RevenueSourceSelectProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleChange = (value: string) => {
    if (value === source) return

    const params = new URLSearchParams(searchParams.toString())
    // The default carries no param, so an untouched dashboard keeps the same
    // URL it had before this selector existed.
    if (value === DEFAULT_REVENUE_SOURCE) {
      params.delete('source')
    } else {
      params.set('source', value)
    }

    startTransition(() => {
      // replace, not push, and the range params are preserved: switching source
      // shouldn't reset the period or fill the back button.
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <Select value={source} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="h-8 w-[140px] text-xs" aria-label="Revenue source">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SOURCE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-xs">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
