import { applyBusinessNotificationChange } from '@/lib/business/notifications/apply-notification-change'

type Row = { id: string; is_read: boolean | null; category: string }

const rows = (): Row[] => [
  { id: 'a', is_read: false, category: 'booking' },
  { id: 'b', is_read: false, category: 'payment' },
  { id: 'c', is_read: true, category: 'booking' },
]

describe('applyBusinessNotificationChange (business copy)', () => {
  it('read: marks the row and lowers the count', () => {
    const next = applyBusinessNotificationChange({ notifications: rows(), unreadCount: 5 }, { type: 'read', id: 'a' })
    expect(next.notifications.find((n) => n.id === 'a')?.is_read).toBe(true)
    expect(next.unreadCount).toBe(4)
  })

  it('read: leaves the count alone for a row already read', () => {
    const next = applyBusinessNotificationChange({ notifications: rows(), unreadCount: 5 }, { type: 'read', id: 'c' })
    expect(next.unreadCount).toBe(5)
  })

  it('read: leaves everything alone for a row not in the list', () => {
    const state = { notifications: rows(), unreadCount: 5 }
    const next = applyBusinessNotificationChange(state, { type: 'read', id: 'zzz' })
    expect(next).toEqual(state)
  })

  it('deleted: removes the row and lowers the count when it was unread', () => {
    const next = applyBusinessNotificationChange({ notifications: rows(), unreadCount: 5 }, { type: 'deleted', id: 'b' })
    expect(next.notifications.map((n) => n.id)).toEqual(['a', 'c'])
    expect(next.unreadCount).toBe(4)
  })

  it('deleted: keeps the count for a read row', () => {
    const next = applyBusinessNotificationChange({ notifications: rows(), unreadCount: 5 }, { type: 'deleted', id: 'c' })
    expect(next.unreadCount).toBe(5)
  })

  it('read-all without a category: everything read, count zero', () => {
    const next = applyBusinessNotificationChange({ notifications: rows(), unreadCount: 9 }, { type: 'read-all' })
    expect(next.notifications.every((n) => n.is_read)).toBe(true)
    expect(next.unreadCount).toBe(0)
  })

  it('read-all with a category: only that category, count lowered by what is visible', () => {
    const next = applyBusinessNotificationChange(
      { notifications: rows(), unreadCount: 9 },
      { type: 'read-all', category: 'booking' }
    )
    expect(next.notifications.map((n) => n.is_read)).toEqual([true, false, true])
    expect(next.unreadCount).toBe(8)
  })

  it('cleared-read: removes read rows, count unchanged', () => {
    const next = applyBusinessNotificationChange({ notifications: rows(), unreadCount: 2 }, { type: 'cleared-read' })
    expect(next.notifications.map((n) => n.id)).toEqual(['a', 'b'])
    expect(next.unreadCount).toBe(2)
  })

  it('cleared-read with a category keeps read rows of other categories', () => {
    const list: Row[] = [...rows(), { id: 'd', is_read: true, category: 'payment' }]
    const next = applyBusinessNotificationChange(
      { notifications: list, unreadCount: 2 },
      { type: 'cleared-read', category: 'booking' }
    )
    expect(next.notifications.map((n) => n.id)).toEqual(['a', 'b', 'd'])
  })


  it('never goes below zero', () => {
    const next = applyBusinessNotificationChange({ notifications: rows(), unreadCount: 0 }, { type: 'read', id: 'a' })
    expect(next.unreadCount).toBe(0)
  })

  it('does not mutate the input', () => {
    const list = rows()
    const snapshot = JSON.parse(JSON.stringify(list))
    applyBusinessNotificationChange({ notifications: list, unreadCount: 3 }, { type: 'read-all' })
    applyBusinessNotificationChange({ notifications: list, unreadCount: 3 }, { type: 'deleted', id: 'a' })
    expect(list).toEqual(snapshot)
  })

  it('treats a null is_read as not unread, matching the server count', () => {
    const list: Row[] = [{ id: 'n', is_read: null, category: 'booking' }]
    const next = applyBusinessNotificationChange({ notifications: list, unreadCount: 1 }, { type: 'read', id: 'n' })
    expect(next.unreadCount).toBe(1)
  })
})
