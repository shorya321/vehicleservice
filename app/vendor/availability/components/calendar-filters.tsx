// Imported only by availability-calendar.tsx, which is already a client entry.
import { CalendarDays, Car, LayoutList, SlidersHorizontal, User } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TOGGLE_ITEM, TOGGLE_LIST } from './calendar-toolbar'
import type { CalendarDriver, CalendarEventSource, CalendarVehicle } from '../types'
import type { ResourceTypeFilter, SourceFilter } from '@/lib/availability/filters'

export interface CalendarFilterState {
  mode: 'calendar' | 'fleet'
  filterType: ResourceTypeFilter
  selectedResourceFilter: string
  sourceFilter: SourceFilter
  showReleased: boolean
}

interface CalendarFiltersProps extends CalendarFilterState {
  vehicles: CalendarVehicle[]
  drivers: CalendarDriver[]
  onModeChange: (mode: 'calendar' | 'fleet') => void
  onFilterTypeChange: (filterType: ResourceTypeFilter) => void
  onResourceChange: (resourceId: string) => void
  onSourceChange: (source: SourceFilter) => void
  onShowReleasedChange: (showReleased: boolean) => void
}

/** How many filters are narrowing the view. Drives the badge on the mobile
 *  Filters button so a hidden filter can never silently empty the screen. */
function activeFilterCount(state: CalendarFilterState): number {
  let count = 0
  if (state.filterType !== 'all') count += 1
  if (state.selectedResourceFilter !== 'all') count += 1
  if (state.sourceFilter !== 'all') count += 1
  if (state.showReleased) count += 1
  return count
}

/** The filter controls themselves, laid out in a column on mobile (inside the
 *  sheet) and a row on desktop. */
function FilterControls({
  stacked,
  filterType,
  selectedResourceFilter,
  sourceFilter,
  showReleased,
  vehicles,
  drivers,
  onFilterTypeChange,
  onResourceChange,
  onSourceChange,
  onShowReleasedChange,
}: Omit<CalendarFiltersProps, 'mode' | 'onModeChange'> & { stacked: boolean }) {
  const resourceLabel = filterType === 'vehicle' ? 'Vehicle' : 'Driver'

  return (
    <div className={cn(stacked ? 'flex flex-col gap-4' : 'flex flex-wrap items-end gap-4')}>
      <div className="space-y-2">
        <Label>Resource Type</Label>
        <Tabs
          value={filterType}
          onValueChange={(v) => onFilterTypeChange(v as ResourceTypeFilter)}
        >
          <TabsList className={cn(TOGGLE_LIST, stacked && 'w-full')}>
            <TabsTrigger value="all" className={cn(TOGGLE_ITEM, stacked && 'flex-1')}>All</TabsTrigger>
            <TabsTrigger value="vehicle" className={cn(TOGGLE_ITEM, stacked && 'flex-1')}>
              <Car className="mr-2 h-4 w-4" />
              Vehicles
            </TabsTrigger>
            <TabsTrigger value="driver" className={cn(TOGGLE_ITEM, stacked && 'flex-1')}>
              <User className="mr-2 h-4 w-4" />
              Drivers
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filterType !== 'all' && (
        <div className="space-y-2">
          <Label>Select {resourceLabel}</Label>
          <Select value={selectedResourceFilter} onValueChange={onResourceChange}>
            <SelectTrigger className={cn(stacked ? 'w-full' : 'w-[250px]')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {resourceLabel}s</SelectItem>
              {filterType === 'vehicle'
                ? vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.make} {v.model} ({v.registration_number})
                    </SelectItem>
                  ))
                : drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.first_name} {d.last_name}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Booking Source</Label>
        <Select value={sourceFilter} onValueChange={(v) => onSourceChange(v as SourceFilter)}>
          <SelectTrigger className={cn(stacked ? 'w-full' : 'w-[190px]')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value={'online' satisfies CalendarEventSource}>Online bookings</SelectItem>
            <SelectItem value={'offline' satisfies CalendarEventSource}>Offline bookings</SelectItem>
            <SelectItem value={'blocked' satisfies CalendarEventSource}>Blocked periods</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={cn('flex items-center gap-2', stacked ? 'pt-2' : 'pb-2')}>
        <Switch id="show-released" checked={showReleased} onCheckedChange={onShowReleasedChange} />
        <Label htmlFor="show-released" className="cursor-pointer font-normal">
          Show completed &amp; cancelled
        </Label>
      </div>
    </div>
  )
}

/**
 * Filter bar.
 *
 * Below `md` the four filters collapse behind a Filters sheet: at 390px they
 * previously consumed the entire first screen, so the calendar the vendor came
 * for was never visible without scrolling. The Calendar/Fleet switch stays
 * inline at every width because it changes what the page *is*, not what it
 * hides.
 */
export function CalendarFilters(props: CalendarFiltersProps) {
  const { mode, onModeChange, ...rest } = props
  const count = activeFilterCount(props)

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        <Label>View</Label>
        <Tabs value={mode} onValueChange={(v) => onModeChange(v as 'calendar' | 'fleet')}>
          <TabsList className={TOGGLE_LIST}>
            <TabsTrigger value="calendar" className={TOGGLE_ITEM}>
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="fleet" className={TOGGLE_ITEM}>
              <LayoutList className="mr-2 h-4 w-4" />
              Fleet
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Mobile: everything behind a sheet. */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {count > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5">{count}</Badge>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="pt-4">
              <FilterControls stacked {...rest} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: inline. */}
      <div className="hidden flex-1 md:block">
        <FilterControls stacked={false} {...rest} />
      </div>
    </div>
  )
}
