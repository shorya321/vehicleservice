"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FormTimePickerProps {
  value: string | undefined
  onChange: (time: string) => void
  placeholder?: string
  isDisabled?: boolean
  className?: string
  popoverClassName?: string
  minuteStep?: number
  id?: string
  "aria-required"?: boolean | "true" | "false"
  "aria-invalid"?: boolean | "true" | "false"
  "aria-describedby"?: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function buildMinutes(step: number) {
  const mins: number[] = []
  for (let m = 0; m < 60; m += step) mins.push(m)
  return mins
}

function pad(n: number) {
  return n.toString().padStart(2, "0")
}

export function FormTimePicker({
  value,
  onChange,
  placeholder = "Select time",
  isDisabled = false,
  className,
  popoverClassName = "luxury-time-popover",
  minuteStep = 5,
  id,
  ...ariaProps
}: FormTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const hourScrollRef = React.useRef<HTMLDivElement>(null)
  const minuteScrollRef = React.useRef<HTMLDivElement>(null)

  const minutes = React.useMemo(() => buildMinutes(minuteStep), [minuteStep])

  const selectedHour = value ? parseInt(value.split(":")[0], 10) : -1
  const selectedMinute = value ? parseInt(value.split(":")[1], 10) : -1

  React.useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      const hourEl = hourScrollRef.current?.querySelector("[data-selected='true']")
      const minuteEl = minuteScrollRef.current?.querySelector("[data-selected='true']")
      hourEl?.scrollIntoView({ block: "center", behavior: "instant" })
      minuteEl?.scrollIntoView({ block: "center", behavior: "instant" })
    })
  }, [open])

  const handleHourSelect = (hour: number) => {
    const min = selectedMinute >= 0 ? selectedMinute : 0
    onChange(`${pad(hour)}:${pad(min)}`)
  }

  const handleMinuteSelect = (minute: number) => {
    const hr = selectedHour >= 0 ? selectedHour : 0
    onChange(`${pad(hr)}:${pad(minute)}`)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={(v) => { if (!isDisabled) setOpen(v) }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={isDisabled}
          className={cn(
            "flex min-h-10 w-full items-center rounded-md border border-border bg-background px-3 text-sm text-foreground font-sans transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
            className
          )}
          {...ariaProps}
        >
          {value || <span>{placeholder}</span>}
          <Clock className="ml-auto h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[200px] p-0", popoverClassName)} align="start">
        <div className="flex h-[248px]">
          <div className="flex-1 flex flex-col">
            <div className="time-column-header">Hour</div>
            <ScrollArea className="flex-1">
              <div ref={hourScrollRef} className="px-1 pb-1">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className="time-option"
                    data-selected={h === selectedHour ? "true" : undefined}
                    onClick={() => handleHourSelect(h)}
                  >
                    {pad(h)}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="time-separator" />
          <div className="flex-1 flex flex-col">
            <div className="time-column-header">Min</div>
            <ScrollArea className="flex-1">
              <div ref={minuteScrollRef} className="px-1 pb-1">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className="time-option"
                    data-selected={m === selectedMinute ? "true" : undefined}
                    onClick={() => handleMinuteSelect(m)}
                  >
                    {pad(m)}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
