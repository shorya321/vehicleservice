'use client'

import { TextField } from '@/components/admin/cms/text-field'
import { SwitchField } from '@/components/admin/cms/switch-field'
import { ImageField } from '@/components/admin/cms/image-field'
import { p, type AboutControl } from './fields'

type HeadSection = 'steps' | 'values' | 'places'

/** Show switch, eyebrow, heading and lede: the head every board section shares. */
export function SectionHead({ control, section }: { control: AboutControl; section: HeadSection }) {
  return (
    <>
      <SwitchField control={control} name={p(`${section}.visible`)} label="Show this section" />
      <TextField control={control} name={p(`${section}.eyebrow`)} label="Eyebrow" max={40} />
      <TextField control={control} name={p(`${section}.title`)} label="Heading (H2)" max={90} recommended={60} />
      <TextField control={control} name={p(`${section}.lede`)} label="Side note" max={200} rows={2} />
    </>
  )
}

export function AboutStepsFields({ control }: { control: AboutControl }) {
  return (
    <div className="space-y-4">
      <SectionHead control={control} section="steps" />
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-4 rounded-lg border bg-card p-4">
            <h4 className="text-sm font-semibold">Card {i + 1}</h4>
            <ImageField control={control} name={p(`steps.items.${i}.image`)} label="Photo" description="Portrait, about 800 x 1000." />
            <TextField control={control} name={p(`steps.items.${i}.tag`)} label="Tag" max={24} />
            <TextField control={control} name={p(`steps.items.${i}.title`)} label="Title (H3)" max={60} />
            <TextField control={control} name={p(`steps.items.${i}.body`)} label="Text" max={200} rows={3} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function AboutValuesFields({ control }: { control: AboutControl }) {
  return (
    <div className="space-y-4">
      <SectionHead control={control} section="values" />
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-4 rounded-lg border bg-card p-4">
            <h4 className="text-sm font-semibold">Column {i + 1}</h4>
            <div className="grid grid-cols-2 gap-3">
              <TextField control={control} name={p(`values.items.${i}.figure`)} label="Number" max={10} />
              <TextField control={control} name={p(`values.items.${i}.unit`)} label="Unit (gold)" max={12} />
            </div>
            <TextField control={control} name={p(`values.items.${i}.title`)} label="Title (H3)" max={60} />
            <TextField control={control} name={p(`values.items.${i}.body`)} label="Text" max={220} rows={3} />
          </div>
        ))}
      </div>
    </div>
  )
}
