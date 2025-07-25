'use client'

import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: Date
  onChange: (date: Date) => void
  className?: string
}

export function DatePicker({ value, onChange, className }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          !value && "text-muted-foreground"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {value ? format(value, 'PPP') : 'Select date'}
      </Button>
      
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-auto rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(newDate) => {
              if (newDate) {
                onChange(newDate)
                setIsOpen(false)
              }
            }}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
          />
        </div>
      )}
    </div>
  )
}