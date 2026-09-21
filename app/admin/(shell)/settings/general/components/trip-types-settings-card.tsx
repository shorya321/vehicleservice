'use client'

import type { Control } from 'react-hook-form'
import { Route } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import type { SiteSettingsFormValues } from '@/lib/site-settings/schema'

interface TripTypesSettingsCardProps {
  control: Control<SiteSettingsFormValues>
}

type ToggleName =
  | 'trip_types.round_trip_enabled'
  | 'trip_types.multi_city_enabled'
  | 'trip_types.hourly_enabled'

type NumberName =
  | 'trip_types.round_trip_discount_percent'
  | 'trip_types.multi_city_max_legs'
  | 'trip_types.hourly_min_notice_hours'
  | 'trip_types.leg_buffer_minutes'

const TOGGLES: { name: ToggleName; label: string; help: string }[] = [
  {
    name: 'trip_types.round_trip_enabled',
    label: 'Round trip',
    help: 'Outbound and return on the reverse route, paid together.',
  },
  {
    name: 'trip_types.multi_city_enabled',
    label: 'Multi-city',
    help: 'Several independent transfers in one checkout.',
  },
  {
    name: 'trip_types.hourly_enabled',
    label: 'Hourly hire',
    help: 'Half day or full day with a chauffeur, as directed. Prices are set per vehicle type.',
  },
]

const NUMBERS: { name: NumberName; label: string; min: number; max: number; step: string; help: string }[] = [
  {
    name: 'trip_types.round_trip_discount_percent',
    label: 'Round trip discount (%)',
    min: 0,
    max: 50,
    step: '0.5',
    help: 'Taken off the base fares of both legs. Add-ons are not discounted. Cancelling one leg forfeits the discount.',
  },
  {
    name: 'trip_types.multi_city_max_legs',
    label: 'Most multi-city legs',
    min: 2,
    max: 6,
    step: '1',
    help: 'How many transfers one multi-city trip may hold.',
  },
  {
    name: 'trip_types.hourly_min_notice_hours',
    label: 'Hourly minimum notice (hours)',
    min: 0,
    max: 168,
    step: '1',
    help: 'How far ahead an hourly hire must be booked.',
  },
  {
    name: 'trip_types.leg_buffer_minutes',
    label: 'Gap between legs (minutes)',
    min: 0,
    max: 720,
    step: '5',
    help: 'Required between one leg\'s estimated arrival and the next leg\'s pickup, including a return.',
  },
]

export function TripTypesSettingsCard({ control }: TripTypesSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Route className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Trip Types</CardTitle>
            <CardDescription>
              Which journeys customers can book, and the rules for each. One way is always on.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {TOGGLES.map((toggle) => (
            <FormField
              key={toggle.name}
              control={control}
              name={toggle.name}
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{toggle.label}</FormLabel>
                    <p className="text-sm text-muted-foreground">{toggle.help}</p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label={`Offer ${toggle.label}`}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {NUMBERS.map((number) => (
            <FormField
              key={number.name}
              control={control}
              name={number.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{number.label}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={number.min}
                      max={number.max}
                      step={number.step}
                      aria-label={number.label}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">{number.help}</p>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
