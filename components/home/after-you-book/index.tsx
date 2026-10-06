import { AfterYouBookPlate } from './after-you-book-plate'
import type { HomeContent } from '@/lib/cms/templates/home/schema'

/**
 * Sits directly under the hero. The ground is --hero-map-fade-end, the colour
 * the hero's map fades into (--black-void in light, --black-rich in dark), so
 * the two sections meet without a seam. Server-rendered, no client JS.
 */
export function AfterYouBook({ content }: { content: HomeContent['after_you_book'] }): React.JSX.Element {
  return (
    <section aria-labelledby="after-you-book-heading" className="after-book-section">
      <div className="luxury-container">
        <AfterYouBookPlate content={content} />
      </div>
    </section>
  )
}
