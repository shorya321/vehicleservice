import { compactAmount, labelStride, showsLabel } from '@/lib/dashboard/chart-format'

describe('compactAmount', () => {
  it.each([
    [0, '0'],
    [950, '950'],
    [2500, '2.5k'],
    [10000, '10k'],
    [12345, '12.3k'],
    [1500000, '1.5M'],
  ])('formats %d as %s', (value, expected) => {
    expect(compactAmount(value)).toBe(expected)
  })
})

describe('x-axis label thinning', () => {
  it('labels every bucket up to twelve', () => {
    expect(labelStride(12)).toBe(1)
    expect(labelStride(30)).toBe(3)
  })

  it('always labels the last bucket and drops a strided label too close to it', () => {
    const stride = labelStride(30)
    expect(showsLabel(29, 29, stride)).toBe(true)
    expect(showsLabel(27, 29, stride)).toBe(false)
    expect(showsLabel(24, 29, stride)).toBe(true)
    expect(showsLabel(1, 29, stride)).toBe(false)
  })
})
