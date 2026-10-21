'use client'

import { TextField } from '@/components/admin/cms/text-field'
import { SwitchField } from '@/components/admin/cms/switch-field'
import { p, type ServicesControl } from './fields'

type HeadSection = 'ways' | 'airport' | 'hourly' | 'beyond' | 'business' | 'fare' | 'fleet' | 'faq'

export const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4 rounded-lg border bg-card p-4">
    <h4 className="text-sm font-semibold">{title}</h4>
    {children}
  </div>
)

/** Show switch, eyebrow and heading: the head every section shares. */
export function SectionHead({ control, section }: { control: ServicesControl; section: HeadSection }) {
  return (
    <>
      <SwitchField control={control} name={p(`${section}.visible`)} label="Show this section" />
      <TextField control={control} name={p(`${section}.eyebrow`)} label="Eyebrow" max={40} />
      <TextField control={control} name={p(`${section}.title`)} label="Heading (H2)" max={90} recommended={60} />
    </>
  )
}

/** A button's text and link side by side. */
export function CtaFields({ control, name, title, placeholder }: { control: ServicesControl; name: string; title: string; placeholder: string }) {
  return (
    <Card title={title}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={control} name={p(`${name}.label`)} label="Text" max={40} />
        <TextField control={control} name={p(`${name}.href`)} label="Link" max={300} placeholder={placeholder} />
      </div>
    </Card>
  )
}

/** Fixed count of title + text cards (airport, beyond Dubai, business). */
export function CardList({ control, section, count }: { control: ServicesControl; section: 'airport' | 'beyond' | 'business'; count: number }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} title={`Card ${i + 1}`}>
          <TextField control={control} name={p(`${section}.items.${i}.title`)} label="Title (H3)" max={60} />
          <TextField control={control} name={p(`${section}.items.${i}.body`)} label="Text" max={220} rows={3} />
        </Card>
      ))}
    </div>
  )
}
