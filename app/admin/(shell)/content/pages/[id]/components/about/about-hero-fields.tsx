'use client'

import { TextField } from '@/components/admin/cms/text-field'
import { ImageField } from '@/components/admin/cms/image-field'
import { p, type AboutControl } from './fields'

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4 rounded-lg border bg-card p-4">
    <h4 className="text-sm font-semibold">{title}</h4>
    {children}
  </div>
)

export function AboutHeroFields({ control }: { control: AboutControl }) {
  return (
    <div className="space-y-4">
      <TextField control={control} name={p('hero.eyebrow')} label="Eyebrow" max={40} />
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <TextField control={control} name={p('hero.title')} label="Main heading (H1)" max={60} />
        <TextField control={control} name={p('hero.accent')} label="Gold last words" max={30} placeholder="driver." />
      </div>
      <TextField control={control} name={p('hero.body')} label="Intro text" max={320} rows={3} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Main button">
          <TextField control={control} name={p('hero.primary.label')} label="Text" max={40} />
          <TextField control={control} name={p('hero.primary.href')} label="Link" max={300} placeholder="/" />
        </Card>
        <Card title="Second button">
          <TextField control={control} name={p('hero.secondary.label')} label="Text" max={40} />
          <TextField control={control} name={p('hero.secondary.href')} label="Link" max={300} placeholder="/contact" />
        </Card>
      </div>


      <Card title="Featured photo">
        <ImageField control={control} name={p('hero.feature.image')} label="Photo" description="Landscape or square, about 1200 x 1000." />
        <TextField control={control} name={p('hero.feature.alt')} label="Photo description (for screen readers)" max={140} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={control} name={p('hero.feature.tag')} label="Top tag" max={30} />
          <TextField control={control} name={p('hero.feature.eyebrow')} label="Caption label" max={30} />
        </div>
        <TextField control={control} name={p('hero.feature.title')} label="Caption heading" max={90} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={control} name={p('hero.feature.metaStart')} label="Caption detail 1" max={40} />
          <TextField control={control} name={p('hero.feature.metaEnd')} label="Caption detail 2" max={40} />
        </div>
      </Card>

      <Card title="Floating card, top right">
        <TextField control={control} name={p('hero.stat.eyebrow')} label="Label" max={30} />
        <TextField control={control} name={p('hero.stat.value')} label="Figure" max={16} />
        <TextField control={control} name={p('hero.stat.caption')} label="Caption" max={40} />
      </Card>
    </div>
  )
}
