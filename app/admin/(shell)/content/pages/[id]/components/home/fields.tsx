'use client'

import type { Control, FieldPath } from 'react-hook-form'
import { TextField } from '@/components/admin/cms/text-field'
import { SwitchField } from '@/components/admin/cms/switch-field'
import type { HomeContent } from '@/lib/cms/templates/home/schema'

export type HomeControl = Control<HomeContent>

/** Dotted path into the home content, e.g. `faq.items.0.question`. */
export function path(value: string): FieldPath<HomeContent> {
  return value as FieldPath<HomeContent>
}

interface SectionHeaderFieldsProps {
  control: HomeControl
  section: string
  /** Hero has no visibility switch: the page always opens with it. */
  showVisible?: boolean
}

/** The eyebrow, H2 and intro every home section opens with. */
export function SectionHeaderFields({ control, section, showVisible = true }: SectionHeaderFieldsProps) {
  return (
    <div className="space-y-4">
      {showVisible && (
        <SwitchField
          control={control}
          name={path(`${section}.visible`)}
          label="Show this section"
          description="Hidden sections disappear from the home page but keep their content."
        />
      )}
      <TextField control={control} name={path(`${section}.eyebrow`)} label="Eyebrow" max={40} />
      <TextField
        control={control}
        name={path(`${section}.title`)}
        label="Heading (H2)"
        max={90}
        recommended={60}
      />
      <TextField control={control} name={path(`${section}.body`)} label="Intro text" max={320} rows={3} />
    </div>
  )
}

interface CtaFieldsProps {
  control: HomeControl
  name: string
  label: string
}

/** A button: its text and where it goes. */
export function CtaFields({ control, name, label }: CtaFieldsProps) {
  return (
    <div className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2">
      <TextField control={control} name={path(`${name}.label`)} label={`${label} text`} max={40} />
      <TextField
        control={control}
        name={path(`${name}.href`)}
        label={`${label} link`}
        max={300}
        placeholder="/contact or #hero"
      />
    </div>
  )
}

interface ItemCardProps {
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
}

/** One entry of a fixed-length list (a city, a promise, a checklist row). */
export function ItemCard({ title, children, actions }: ItemCardProps) {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{title}</h4>
        {actions}
      </div>
      {children}
    </div>
  )
}
