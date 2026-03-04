"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
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
}: FormDatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={(v) => { if (!isDisabled) setOpen(v) }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={isDisabled}
          className={cn(
            "flex h-10 w-full items-center rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground font-sans transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
            className
          )}
        >
          {value ? format(value, dateFormat) : <span>{placeholder}</span>}
          <CalendarIcon className="ml-auto h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
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
}
