import { readableAccentHsl, contrastRatio } from '@/lib/admin/theme-utils'

function hslToHex(hsl: string): string {
  const [h, s, l] = hsl.replace(/%/g, '').split(' ').map(Number)
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(c * 255).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

describe('readableAccentHsl', () => {
  it('darkens the default gold until it reads on white', () => {
    const out = readableAccentHsl('#BA955E', '#FFFFFF')
    expect(contrastRatio(hslToHex(out), '#FFFFFF')).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps the hue and saturation of the accent', () => {
    const out = readableAccentHsl('#BA955E', '#FFFFFF')
    expect(out.startsWith('36 40% ')).toBe(true)
  })

  it('returns the accent unchanged when it already reads', () => {
    expect(readableAccentHsl('#5B4320', '#FFFFFF')).toBe('36 48% 24%')
  })

  it('stops at the darkest step instead of looping forever', () => {
    expect(readableAccentHsl('#BA955E', '#FFFFFF', 22)).toBe('36 40% 0%')
  })
})

describe('contrastRatio', () => {
  it('is 21 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1)
  })
})
