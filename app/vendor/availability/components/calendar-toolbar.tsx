// No 'use client' directive: this module is only ever imported by
// availability-calendar.tsx, which is already a client entry. Marking it as its
// own entry would force every exported component's props to be serializable,
// and these take callbacks.
import { View, ToolbarProps } from 'react-big-calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '../types'

/** The event shape react-big-calendar receives: dates rehydrated, then shifted
 *  to Dubai wall-clock by `lib/availability/display-tz`. */
export interface CustomEvent extends Omit<CalendarEvent, 'start' | 'end'> {
  start: Date
  end: Date
}

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Mirrors the SelectTrigger look (border-border, neutral text, h-9, normal case) so
// the nav/view buttons match the Month/Year dropdowns instead of the gold outline.
export const TOOLBAR_BTN =
  'inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50'

/** One selected-state language for every toggle group on this page: gold fill,
 *  near-black label. `--accent` / `--accent-foreground` are the only gold pair
 *  the vendor theme writes inline in BOTH modes (#BA955E on #09090B, 7.1:1);
 *  `--primary-foreground` is white in light mode, which would be 2.8:1. Stock
 *  shadcn paints the active pill `bg-background` on `bg-muted`: 1.04:1 here in
 *  light, and in dark an active tab DARKER than its own track. */
export const TOGGLE_LIST =
  'inline-flex h-9 items-center justify-center gap-1 rounded-md border border-border bg-muted p-1 text-muted-foreground'

export const TOGGLE_ITEM =
  'inline-flex h-7 items-center justify-center whitespace-nowrap rounded px-3 py-0 text-sm font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-none'

/** Month + year dropdowns that jump straight to any month. Shared by the
 *  react-big-calendar toolbar and the Fleet toolbar, which previously had no way
 *  to move more than one span at a time. */
export function MonthYearJump({
  date,
  onJump,
}: {
  date: Date
  onJump: (next: Date) => void
}) {
  const currentMonth = date.getMonth()
  const currentYear = date.getFullYear()

  // A ±5-year window, widened to always include whatever year is on screen.
  const thisYear = new Date().getFullYear()
  const start = Math.min(thisYear - 5, currentYear)
  const end = Math.max(thisYear + 5, currentYear)
  const years = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <>
      <Select
        value={String(currentMonth)}
        onValueChange={(v) => onJump(new Date(currentYear, Number(v), 1))}
      >
        <SelectTrigger className="h-9 w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTH_LABELS.map((label, i) => (
            <SelectItem key={label} value={String(i)}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(currentYear)}
        onValueChange={(v) => onJump(new Date(Number(v), currentMonth, 1))}
      >
        <SelectTrigger className="h-9 w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}

/** Custom toolbar: keeps RBC's Today/Back/Next + view buttons, adds the month and
 *  year jump, and states the timezone every time shown below it is drawn in. */
export function CalendarToolbar({
  date,
  view,
  views,
  onNavigate,
  onView,
}: ToolbarProps<CustomEvent, object>) {
  const viewNames = Array.isArray(views) ? (views as View[]) : []

  return (
    <div className="mb-5 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={TOOLBAR_BTN} onClick={() => onNavigate('TODAY')}>Today</button>
          <button type="button" className={TOOLBAR_BTN} onClick={() => onNavigate('PREV')}>Back</button>
          <button type="button" className={TOOLBAR_BTN} onClick={() => onNavigate('NEXT')}>Next</button>
          <MonthYearJump date={date} onJump={(next) => onNavigate('DATE', next)} />
        </div>

        <div className="flex items-center gap-2">
          {viewNames.map((name) => (
            <button
              key={name}
              type="button"
              className={cn(TOOLBAR_BTN, view === name && 'border-accent bg-accent text-accent-foreground')}
              onClick={() => onView(name)}
            >
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Times shown in Dubai time</p>
    </div>
  )
}
