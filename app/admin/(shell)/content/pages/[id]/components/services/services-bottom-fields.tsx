'use client'

import { TextField } from '@/components/admin/cms/text-field'
import { FaqListEditor } from '@/components/admin/cms/faq-list-editor'
import { FARE_EXTRA_SLOTS, FARE_INCLUDED_SLOTS } from '@/lib/cms/templates/services/schema'
import { Card, CardList, CtaFields, SectionHead } from './services-shared-fields'
import { p, type ServicesControl } from './fields'

export function ServicesBusinessFields({ control }: { control: ServicesControl }) {
  return (
    <div className="space-y-4">
      <SectionHead control={control} section="business" />
      <CardList control={control} section="business" count={3} />
      <div className="grid gap-4 lg:grid-cols-2">
        <CtaFields control={control} name="business.primary" title="Main button" placeholder="/business" />
        <CtaFields control={control} name="business.secondary" title="Second button" placeholder="/contact" />
      </div>
    </div>
  )
}

/** One field per line item; empty lines are hidden. */
function LineList({ control, name, title, count }: { control: ServicesControl; name: string; title: string; count: number }) {
  return (
    <Card title={title}>
      {Array.from({ length: count }, (_, i) => (
        <TextField key={i} control={control} name={p(`${name}.${i}`)} label={`Line ${i + 1}`} max={120} />
      ))}
    </Card>
  )
}

export function ServicesFareFields({ control }: { control: ServicesControl }) {
  return (
    <div className="space-y-4">
      <SectionHead control={control} section="fare" />
      <p className="text-sm text-muted-foreground">Must match the Terms. Empty lines are hidden; an empty column disappears.</p>
      <div className="grid gap-4 lg:grid-cols-3">
        <LineList control={control} name="fare.included" title="Included in every fare" count={FARE_INCLUDED_SLOTS} />
        <LineList control={control} name="fare.extras" title="Add at checkout" count={FARE_EXTRA_SLOTS} />
        <LineList control={control} name="fare.onRequest" title="On request" count={FARE_EXTRA_SLOTS} />
      </div>
      <TextField control={control} name={p('fare.footnote')} label="Line under the lists" max={240} rows={2} />
    </div>
  )
}

export function ServicesFleetFields({ control }: { control: ServicesControl }) {
  return (
    <div className="space-y-4">
      <SectionHead control={control} section="fleet" />
      <p className="text-sm text-muted-foreground">Vendors change their cars. Re-check the models against the search results before saving. No prices here.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Card key={i} title={`Class ${i + 1}`}>
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
              <TextField control={control} name={p(`fleet.items.${i}.name`)} label="Class name" max={30} />
              <TextField control={control} name={p(`fleet.items.${i}.seats`)} label="Seats" max={4} />
              <TextField control={control} name={p(`fleet.items.${i}.bags`)} label="Bags" max={4} />
            </div>
            <TextField control={control} name={p(`fleet.items.${i}.models`)} label="Example models" max={160} />
          </Card>
        ))}
      </div>
      <CtaFields control={control} name="fleet.cta" title="Button" placeholder="/search" />
    </div>
  )
}

export function ServicesFaqFields({ control }: { control: ServicesControl }) {
  return (
    <div className="space-y-4">
      <SectionHead control={control} section="faq" />
      <FaqListEditor control={control} name="faq.items" />
    </div>
  )
}
