import {
  appendUniqueBusinessNotifications,
  mergeIncomingBusinessNotification,
} from '@/lib/business/notifications/page-live-insert'

type Row = { id: string; category: string }

const list = (): Row[] => [
  { id: 'a', category: 'booking' },
  { id: 'b', category: 'payment' },
]

describe('mergeIncomingBusinessNotification', () => {
  it('puts a new row at the top on the All tab', () => {
    const next = mergeIncomingBusinessNotification(list(), { id: 'n', category: 'review' }, 'all')
    expect(next.map((r) => r.id)).toEqual(['n', 'a', 'b'])
  })

  it('adds a row whose category matches the active tab', () => {
    const next = mergeIncomingBusinessNotification(list(), { id: 'n', category: 'booking' }, 'booking')
    expect(next.map((r) => r.id)).toEqual(['n', 'a', 'b'])
  })

  it('skips a row from another category and returns the same list', () => {
    const current = list()
    const next = mergeIncomingBusinessNotification(current, { id: 'n', category: 'payment' }, 'booking')
    expect(next).toBe(current)
  })

  it('skips a row that is already listed (event delivered twice)', () => {
    const current = list()
    const next = mergeIncomingBusinessNotification(current, { id: 'a', category: 'booking' }, 'all')
    expect(next).toBe(current)
  })

  it('does not mutate the input', () => {
    const current = list()
    const snapshot = JSON.parse(JSON.stringify(current))
    mergeIncomingBusinessNotification(current, { id: 'n', category: 'booking' }, 'all')
    expect(current).toEqual(snapshot)
  })
})

describe('appendUniqueBusinessNotifications', () => {
  it('appends the next page', () => {
    const next = appendUniqueBusinessNotifications(list(), [{ id: 'c', category: 'booking' }])
    expect(next.map((r) => r.id)).toEqual(['a', 'b', 'c'])
  })

  it('drops rows already shown, as after a live insert shifts the offset', () => {
    const next = appendUniqueBusinessNotifications(list(), [
      { id: 'b', category: 'payment' },
      { id: 'c', category: 'booking' },
    ])
    expect(next.map((r) => r.id)).toEqual(['a', 'b', 'c'])
  })

  it('drops duplicates within the incoming page too', () => {
    const next = appendUniqueBusinessNotifications([], [
      { id: 'c', category: 'booking' },
      { id: 'c', category: 'booking' },
    ])
    expect(next.map((r) => r.id)).toEqual(['c'])
  })

  it('does not mutate the input', () => {
    const current = list()
    const snapshot = JSON.parse(JSON.stringify(current))
    appendUniqueBusinessNotifications(current, [{ id: 'c', category: 'booking' }])
    expect(current).toEqual(snapshot)
  })
})
