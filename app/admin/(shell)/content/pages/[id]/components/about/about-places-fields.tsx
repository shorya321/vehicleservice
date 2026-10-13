'use client'

import { useFieldArray } from 'react-hook-form'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/admin/cms/text-field'
import { ImageField } from '@/components/admin/cms/image-field'
import { SectionHead } from './about-section-fields'
import { p, type AboutControl } from './fields'

const MAX_PLACES = 8

/** Where trips start: a rail of photo cards, added, removed and reordered here. */
export function AboutPlacesFields({ control }: { control: AboutControl }) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'places.items' })

  return (
    <div className="space-y-4">
      <SectionHead control={control} section="places" />
      <div className="grid gap-4 lg:grid-cols-2">
        {fields.map((field, i) => (
          <div key={field.id} className="space-y-4 rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold">Place {i + 1}</h4>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Move down" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Remove place" disabled={fields.length === 1} onClick={() => remove(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ImageField control={control} name={p(`places.items.${i}.image`)} label="Photo" description="Portrait, about 640 x 860." />
            <TextField control={control} name={p(`places.items.${i}.name`)} label="Name" max={40} />
            <TextField control={control} name={p(`places.items.${i}.note`)} label="Detail" max={60} />
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={fields.length >= MAX_PLACES}
        onClick={() => append({ name: 'New place', note: '', image: '/images/cities/downtown.webp' })}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add a place
      </Button>
    </div>
  )
}
