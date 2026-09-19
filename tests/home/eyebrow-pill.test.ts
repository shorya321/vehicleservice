/**
 * Every eyebrow on the customer-facing frontend wears the After you book
 * marker: a gold dot in a capsule (.editorial-eyebrow--pill), not the 28px gold
 * rule the eyebrow classes used to paint. The rule read as a stray dash in front
 * of the label.
 *
 * Three classes carry that label role, and all three take the capsule:
 * .editorial-eyebrow, .account-eyebrow, and .checkout-section-title (the form
 * section labels on checkout, payment, contact and the vendor application).
 *
 * One deliberate exception: the home hero, which is centred and carries a mirror
 * on the right (.hero-eyebrow::after), so the rule still reads as a frame there.
 *
 * The cascade enforces none of this. .account-eyebrow and .checkout-section-title
 * are both declared outside @layer components, so without the unlayered
 * overrides in globals.css they would keep painting the rule even with the
 * modifier present. That half is checked against the stylesheet below.
 */
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.tsx') ? [path] : []
  })

const LABEL = /className="[^"]*\b(?:editorial-eyebrow|account-eyebrow|checkout-section-title)\b[^"]*"/g

/** Every className on the file naming one of the three label classes. */
const labelClassNames = (source: string): string[] =>
  (source.match(LABEL) ?? []).map((match) => match.slice('className="'.length, -1))

const frontendFiles = ['app', 'components'].flatMap((root) => walk(join(process.cwd(), root)))
const isHomeHero = (path: string): boolean => path.includes(join('components', 'home', 'hero'))
const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8')

/** The declaration block of one exact selector, or '' when it is absent. */
const block = (selector: string): string => {
  const at = css.indexOf(`${selector} {`)
  return at === -1 ? '' : css.slice(at, css.indexOf('}', at))
}

describe('eyebrow marker across the frontend', () => {
  it('finds the labels, so nothing below passes by matching nothing', () => {
    const all = frontendFiles.flatMap((path) => labelClassNames(readFileSync(path, 'utf8')))
    expect(all.length).toBeGreaterThanOrEqual(60)
  })

  it('gives every label the capsule, on every surface but the home hero', () => {
    const missing = frontendFiles
      .filter((path) => !isHomeHero(path))
      .flatMap((path) =>
        labelClassNames(readFileSync(path, 'utf8'))
          .filter((className) => !className.includes('editorial-eyebrow--pill'))
          .map((className) => `${path.replace(process.cwd(), '')}  ${className}`)
      )

    expect(missing).toEqual([])
  })

  it('leaves the home hero on the gold rule', () => {
    const names = frontendFiles.filter(isHomeHero).flatMap((path) => labelClassNames(readFileSync(path, 'utf8')))

    expect(names).toHaveLength(1)
    expect(names[0]).toContain('hero-eyebrow')
    expect(names[0]).not.toContain('editorial-eyebrow--pill')
  })

  it('gives every capsule its dot, which the CSS styles as .editorial-eyebrow--pill i', () => {
    for (const path of frontendFiles) {
      const source = readFileSync(path, 'utf8')
      const declared = labelClassNames(source).filter((name) => name.includes('editorial-eyebrow--pill')).length
      const withDot = (source.match(/className="[^"]*editorial-eyebrow--pill[^"]*"[^>]*>\s*<i /g) ?? []).length
      expect(withDot).toBe(declared)
    }
  })

  it.each(['.account-eyebrow', '.checkout-section-title'])(
    'kills the unlayered rule on %s, which the layered capsule cannot reach',
    (selector) => {
      expect(block(`${selector}.editorial-eyebrow--pill::before`)).toContain('content: none')
    }
  )

  it('keeps a bordered capsule from stretching across the checkout section row', () => {
    expect(block('.checkout-section-title.editorial-eyebrow--pill')).toContain('flex: none')
  })

  it('leads the testimonial attribution with the dot, not a rule', () => {
    const attr = block('  .record-attr::before')
    expect(attr).toContain('border-radius: 50%')
    expect(attr).not.toMatch(/height:\s*1px/)
  })
})
