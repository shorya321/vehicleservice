"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface FormDatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: (date: Date) => boolean
  isDisabled?: boolean
  captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years"
  startMonth?: Date
  endMonth?: Date
  className?: string
  dateFormat?: string
  /**
   * Show an X that resets the field to empty.
   *
   * Off by default, so every existing caller renders exactly as before. Optional date fields
   * need it: react-day-picker only clears by clicking the selected day a second time, which
   * nobody discovers.
   */
  clearable?: boolean
}

export function FormDatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  isDisabled = false,
  captionLayout = "label",
  startMonth,
  endMonth,
  className,
  dateFormat = "PPP",
  clearable = false,
}: FormDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const showClear = clearable && Boolean(value) && !isDisabled

  const trigger = (
    <PopoverTrigger asChild>
      <button
        type="button"
        disabled={isDisabled}
        className={cn(
          "flex min-h-10 w-full items-center rounded-md border border-border bg-background px-3 text-sm text-foreground font-sans transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !value && "text-muted-foreground",
          // Room for the clear button, which is layered over the trigger rather than nested
          // inside it — a button inside a button is invalid markup.
          showClear && "pr-10",
          className
        )}
      >
        {value ? format(value, dateFormat) : <span>{placeholder}</span>}
        <CalendarIcon className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    </PopoverTrigger>
  )

  const picker = (
    <Popover open={open} onOpenChange={(v) => { if (!isDisabled) setOpen(v) }}>
      {trigger}
      <PopoverContent className="luxury-calendar-popover w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date)
            setOpen(false)
          }}
          disabled={disabled}
          captionLayout={captionLayout}
          startMonth={startMonth}
          endMonth={endMonth}
          defaultMonth={value}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )

  // Only clearable pickers get the wrapper. Without it the Popover stays the root element, so
  // FormControl keeps cloning its aria props straight onto the trigger for every other caller.
  if (!showClear) return picker

  return (
    <div className="relative">
      {picker}
      <button
        type="button"
        aria-label="Clear date"
        onClick={() => onChange(undefined)}
        className="absolute right-9 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
