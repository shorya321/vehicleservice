'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: Date
  onChange: (date: Date) => void
  className?: string
}

export function DatePicker({ value, onChange, className }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-left font-normal",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
          {value ? format(value, 'PPP') : 'Select date'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="luxury-calendar-popover w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(newDate) => {
            if (newDate) {
              onChange(newDate)
              setOpen(false)
            }
          }}
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          defaultMonth={value}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
