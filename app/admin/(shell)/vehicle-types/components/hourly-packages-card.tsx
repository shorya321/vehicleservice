'use client'

import { useState, useTransition } from 'react'
import { Clock, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { HOURLY_PACKAGE_LABELS } from '@/lib/trips/constants'
import type { HourlyPackageRecord } from '@/lib/trips/hourly-package-schema'
import { saveHourlyPackage } from '../actions/hourly-packages'

interface HourlyPackagesCardProps {
  vehicleTypeId: string
  vehicleTypeName: string
  packages: HourlyPackageRecord[]
}

type NumericField = 'hours' | 'included_km' | 'price' | 'extra_hour_price'

const FIELDS: { key: NumericField; label: string; step: string; suffix?: string }[] = [
  { key: 'hours', label: 'Hours', step: '0.5' },
  { key: 'included_km', label: 'Included km', step: '1' },
  { key: 'price', label: 'Price', step: '0.01', suffix: 'AED' },
  { key: 'extra_hour_price', label: 'Extra hour', step: '0.01', suffix: 'AED' },
]

function PackageRow({ vehicleTypeId, initial }: { vehicleTypeId: string; initial: HourlyPackageRecord }) {
  const [values, setValues] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const dirty = JSON.stringify(values) !== JSON.stringify(saved)
  const idBase = `hourly-${initial.package}`

  function handleSave() {
    startTransition(async () => {
      const result = await saveHourlyPackage(vehicleTypeId, values)
      if (result.success) {
        setSaved(values)
        toast.success(`${HOURLY_PACKAGE_LABELS[values.package]} package saved`)
      } else {
        toast.error(result.error ?? 'Could not save the package')
      }
    })
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">{HOURLY_PACKAGE_LABELS[values.package]}</p>
          <p className="text-sm text-muted-foreground">
            {values.is_active ? 'Offered to customers' : 'Not offered'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`${idBase}-active`} className="text-sm">Active</Label>
          <Switch
            id={`${idBase}-active`}
            checked={values.is_active}
            onCheckedChange={(checked) => setValues((prev) => ({ ...prev, is_active: checked }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={`${idBase}-${field.key}`}>
              {field.label}
              {field.suffix ? ` (${field.suffix})` : ''}
            </Label>
            <Input
              id={`${idBase}-${field.key}`}
              type="number"
              min="0"
              step={field.step}
              value={values[field.key]}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, [field.key]: Number(event.target.value) }))
              }
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={handleSave} disabled={!dirty || isPending}>
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save {HOURLY_PACKAGE_LABELS[values.package].toLowerCase()}
        </Button>
      </div>
    </div>
  )
}

export function HourlyPackagesCard({ vehicleTypeId, vehicleTypeName, packages }: HourlyPackagesCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Hourly Packages</CardTitle>
            <CardDescription>
              Fixed prices for hiring a {vehicleTypeName} with a chauffeur, as directed. A package
              that is not active is not shown in hourly search.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {packages.map((pkg) => (
          <PackageRow key={pkg.package} vehicleTypeId={vehicleTypeId} initial={pkg} />
        ))}
      </CardContent>
    </Card>
  )
}
