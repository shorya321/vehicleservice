'use client'

import { TextField } from '@/components/admin/cms/text-field'
import { ImageField } from '@/components/admin/cms/image-field'
import { Card, CardList, CtaFields, SectionHead } from './services-shared-fields'
import { p, type ServicesControl } from './fields'

export function ServicesHeroFields({ control }: { control: ServicesControl }) {
  return (
    <div className="space-y-4">
      <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        The homepage targets &quot;Dubai chauffeur service&quot;. Keep that phrase out of this heading so the two pages do not compete.
      </p>
      <TextField control={control} name={p('hero.eyebrow')} label="Eyebrow" max={40} />
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <TextField control={control} name={p('hero.title')} label="Main heading (H1)" max={60} />
        <TextField control={control} name={p('hero.accent')} label="Gold last words" max={30} />
      </div>
      <TextField control={control} name={p('hero.body')} label="Intro text" max={320} rows={3} />
      <div className="grid gap-4 lg:grid-cols-2">
        <CtaFields control={control} name="hero.primary" title="Main button" placeholder="/" />
        <CtaFields control={control} name="hero.secondary" title="Second button" placeholder="/business" />
      </div>
      <Card title="Chips under the buttons">
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <TextField key={i} control={control} name={p(`hero.chips.${i}`)} label={`Chip ${i + 1}`} max={40} />
          ))}
        </div>
      </Card>
      <Card title="Photo">
        <ImageField control={control} name={p('hero.image')} label="Photo" description="Landscape or square, about 1200 x 1000." />
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <TextField control={control} name={p('hero.imageAlt')} label="Photo description (for screen readers)" max={140} />
          <TextField control={control} name={p('hero.imageTag')} label="Tag on the photo" max={30} />
        </div>
      </Card>
    </div>
  )
}

export function ServicesWaysFields({ control }: { control: ServicesControl }) {
  return (
    <div className="space-y-4">
      <SectionHead control={control} section="ways" />
      <p className="text-sm text-muted-foreground">Point each button at the matching search tab, for example /?trip=hourly.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} title={`Card ${i + 1}`}>
            <ImageField control={control} name={p(`ways.items.${i}.image`)} label="Photo" description="Portrait, about 800 x 1060." />
            <TextField control={control} name={p(`ways.items.${i}.title`)} label="Title (H3)" max={40} />
            <TextField control={control} name={p(`ways.items.${i}.body`)} label="Text" max={200} rows={3} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={control} name={p(`ways.items.${i}.cta.label`)} label="Button text" max={40} />
              <TextField control={control} name={p(`ways.items.${i}.cta.href`)} label="Button link" max={300} placeholder="/" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function ServicesAirportFields({ control }: { control: ServicesControl }) {
  return (
    <div className="space-y-4">
      <SectionHead control={control} section="airport" />
      <CardList control={control} section="airport" count={3} />
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
        <TextField control={control} name={p('airport.note')} label="Line under the cards" max={120} />
        <TextField control={control} name={p('airport.link.label')} label="Link text" max={40} />
        <TextField control={control} name={p('airport.link.href')} label="Link" max={300} placeholder="/faq" />
      </div>
    </div>
  )
}

export function ServicesHourlyFields({ control }: { control: ServicesControl }) {
  return (
    <div className="space-y-4">
      <SectionHead control={control} section="hourly" />
      <TextField control={control} name={p('hourly.body')} label="Text" max={600} rows={4} />
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} title={`Point ${i + 1}`}>
            <TextField control={control} name={p(`hourly.points.${i}.label`)} label="Label" max={30} />
            <TextField control={control} name={p(`hourly.points.${i}.value`)} label="Value" max={120} />
          </Card>
        ))}
      </div>
      <CtaFields control={control} name="hourly.cta" title="Button" placeholder="/" />
      <Card title="Photo">
        <p className="text-sm text-muted-foreground">Leave empty and the section shows as text only.</p>
        <ImageField control={control} name={p('hourly.image')} label="Photo" description="Landscape, about 1200 x 960." />
        <TextField control={control} name={p('hourly.imageAlt')} label="Photo description (for screen readers)" max={140} />
      </Card>
    </div>
  )
}

export function ServicesBeyondFields({ control }: { control: ServicesControl }) {
  return (
    <div className="space-y-4">
      <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Turn this on only once Abu Dhabi and Al Maktoum (DWC) can really be picked in the booking search.
      </p>
      <SectionHead control={control} section="beyond" />
      <CardList control={control} section="beyond" count={2} />
    </div>
  )
}
