'use client'

import { TextField } from '@/components/admin/cms/text-field'
import { SwitchField } from '@/components/admin/cms/switch-field'
import { ItemCard, path, type HomeControl } from './fields'

export function HeroSection({ control }: { control: HomeControl }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={control} name={path('hero.eyebrow')} label="Eyebrow" max={60} />
        <TextField
          control={control}
          name={path('hero.eyebrow_accent')}
          label="Eyebrow highlight (gold)"
          max={30}
          description="Shown after the eyebrow in gold. Leave empty for none."
        />
      </div>
      <TextField
        control={control}
        name={path('hero.title')}
        label="Main heading (H1)"
        max={70}
        recommended={60}
        description="The page's only H1. Put the main search phrase here."
      />
      <TextField control={control} name={path('hero.summary')} label="Summary" max={220} rows={3} />

      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Trust points under the search form</h4>
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <TextField key={i} control={control} name={path(`hero.trust.${i}`)} label={`Point ${i + 1}`} max={40} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Stats</h4>
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <ItemCard key={i} title={`Stat ${i + 1}`}>
              <TextField control={control} name={path(`hero.stats.${i}.label`)} label="Label" max={20} />
              <TextField control={control} name={path(`hero.stats.${i}.value`)} label="Value" max={12} />
              <SwitchField
                control={control}
                name={path(`hero.stats.${i}.is_rating`)}
                label="Star rating"
                description="Adds a star. Hidden until the site has approved reviews."
              />
            </ItemCard>
          ))}
        </div>
      </div>
    </div>
  )
}
