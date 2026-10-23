/**
 * The header notification panel shared by the admin and vendor portals.
 * Pins the pure helpers (grouping on the operating-timezone day, tab filter,
 * badge and empty copy) and the rendered panel, so a restyle cannot drop the
 * unread count, the mark-all control or the link to the full page.
 * The Radix popover is swapped for inline elements because the real one
 * portals its content and renders nothing on the server while closed.
 */
import { jsx } from 'react/jsx-runtime'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Notification } from '@/lib/notifications/types'
import {
  badgeLabel,
  categoryMeta,
  emptyCopy,
  filterNotifications,
  groupNotifications,
  notificationTime,
  PANEL_ROWS,
} from '@/lib/notifications/panel'

jest.mock('@/components/ui/popover', () => {
  const { jsx: j } = jest.requireActual('react/jsx-runtime')
  return {
    Popover: ({ children }: { children?: ReactNode }) => j('div', { children }),
    PopoverTrigger: ({ children }: { children?: ReactNode }) => j('div', { children }),
    PopoverContent: ({ children, className }: { children?: ReactNode; className?: string }) =>
      j('div', { className, children }),
  }
})

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))

jest.mock('next/link', () => {
  const { jsx: j } = jest.requireActual('react/jsx-runtime')
  return {
    __esModule: true,
    default: ({ href, children, className }: { href: string; children?: ReactNode; className?: string }) =>
      j('a', { href, className, children }),
  }
})

import { NotificationPanel } from '@/components/admin/notifications/notification-panel'

const make = (over: Partial<Notification>): Notification =>
  ({
    id: 'n1',
    user_id: 'u1',
    category: 'booking',
    title: 'New booking received',
    message: 'BK-1 from DXB to Palm Jumeirah',
    link: '/admin/bookings/1',
    is_read: false,
    created_at: new Date().toISOString(),
    data: null,
    read_at: null,
    ...over,
  }) as Notification

const noop = async (): Promise<void> => {}

const render = (notifications: Notification[], unreadCount: number, loading = false): string =>
  renderToStaticMarkup(
    jsx(NotificationPanel, {
      notifications,
      unreadCount,
      loading,
      markAsRead: noop,
      markAllAsRead: noop,
      deleteNotification: noop,
      viewAllHref: '/vendor/notifications',
      idleMessage: 'New trips, payouts and reviews will show up here.',
    })
  )

describe('notification panel helpers', () => {
  it('groups on the Dubai day, not the UTC one', () => {
    // 21:00 UTC on the 22nd is 01:00 on the 23rd in Dubai; 19:00 UTC is 23:00 on the 22nd.
    const afterMidnight = make({ id: 'a', created_at: '2026-10-22T21:00:00.000Z' })
    const beforeMidnight = make({ id: 'b', created_at: '2026-10-22T19:00:00.000Z' })
    const undated = make({ id: 'c', created_at: null })

    const groups = groupNotifications([afterMidnight, beforeMidnight, undated], '2026-10-23')

    expect(groups.today.map((n) => n.id)).toEqual(['a'])
    expect(groups.earlier.map((n) => n.id)).toEqual(['b', 'c'])
  })

  it('filters to unread rows on the Unread tab only', () => {
    const list = [make({ id: 'a', is_read: false }), make({ id: 'b', is_read: true }), make({ id: 'c', is_read: null })]
    expect(filterNotifications(list, 'all')).toHaveLength(3)
    expect(filterNotifications(list, 'unread').map((n) => n.id)).toEqual(['a', 'c'])
  })

  it('caps either tab at PANEL_ROWS so the panel never needs a scrollbar', () => {
    const list = Array.from({ length: 10 }, (_, i) => make({ id: `n${i}`, is_read: i % 4 === 0 }))
    expect(filterNotifications(list, 'all').map((n) => n.id)).toEqual(['n0', 'n1', 'n2', 'n3', 'n4'])
    expect(filterNotifications(list, 'unread').map((n) => n.id)).toEqual(['n1', 'n2', 'n3', 'n5', 'n6'])
    expect(PANEL_ROWS).toBe(5)
  })

  it('caps the badge at 9+', () => {
    expect(badgeLabel(3)).toBe('3')
    expect(badgeLabel(9)).toBe('9')
    expect(badgeLabel(10)).toBe('9+')
  })

  it('falls back to the system category for an unknown value', () => {
    expect(categoryMeta('vendor_application')).toEqual({ label: 'Vendor application', tone: 'violet' })
    expect(categoryMeta('not-a-category')).toEqual({ label: 'System', tone: 'zinc' })
    expect(categoryMeta(null)).toEqual({ label: 'System', tone: 'zinc' })
  })

  it('computes the time from created_at and falls back to timeAgo', () => {
    const now = new Date('2026-10-23T10:00:00.000Z')
    expect(notificationTime(make({ created_at: '2026-10-23T09:55:00.000Z' }), now)).toBe('5m ago')
    expect(notificationTime(make({ created_at: null, timeAgo: 'about 1 hour ago' }), now)).toBe('about 1 hour ago')
    expect(notificationTime(make({ created_at: null }), now)).toBe('')
  })

  it('words the empty state by tab and by unread rows beyond the loaded page', () => {
    expect(emptyCopy('all', 0, 'Idle').title).toBe('You are all caught up')
    expect(emptyCopy('all', 0, 'Idle').body).toBe('Idle')
    expect(emptyCopy('unread', 0, 'Idle').title).toBe('No unread notifications')
    expect(emptyCopy('unread', 4, 'Idle').title).toBe('Older unread notifications')
  })
})

describe('NotificationPanel', () => {
  it('shows the unread count on the bell, the chip and the Unread tab', () => {
    const html = render([make({ id: 'a' }), make({ id: 'b' }), make({ id: 'c', is_read: true })], 2)
    expect(html).toContain('aria-label="Notifications, 2 unread"')
    expect(html).toContain('class="notif-trigger__badge" aria-hidden="true">2<')
    expect(html).toContain('>2 new<')
    expect(html).toContain('Mark all read')
    expect(html).toContain('Unread<span class="notif-panel__tab-count">2<')
  })

  it('hides the badge, chip and mark-all control when nothing is unread', () => {
    const html = render([make({ is_read: true })], 0)
    expect(html).toContain('aria-label="Notifications"')
    expect(html).not.toContain('notif-trigger__badge')
    expect(html).not.toContain('Mark all read')
    expect(html).not.toContain(' new<')
  })

  it('splits rows into Today and Earlier and marks unread ones', () => {
    const html = render(
      [make({ id: 'a', title: 'Fresh' }), make({ id: 'b', title: 'Old', is_read: true, created_at: '2020-01-01T08:00:00.000Z' })],
      1
    )
    expect(html).toContain('>Today<')
    expect(html).toContain('>Earlier<')
    expect(html.match(/notif-row--unread/g)).toHaveLength(1)
    expect(html.indexOf('Fresh')).toBeLessThan(html.indexOf('Old'))
  })

  it('shows no count on the All tab, since the loaded page is not the total', () => {
    expect(render([make({ is_read: true })], 0)).toContain('>All</button>')
  })

  it('renders at most five rows however many were loaded', () => {
    const list = Array.from({ length: 10 }, (_, i) => make({ id: `n${i}` }))
    expect(render(list, 10).match(/aria-label="Delete notification"/g)).toHaveLength(5)
  })

  it('renders a delete button per row', () => {
    const html = render([make({ id: 'a' }), make({ id: 'b' })], 2)
    expect(html.match(/aria-label="Delete notification"/g)).toHaveLength(2)
  })

  it('links to the portal page it was given, even when empty', () => {
    expect(render([], 0)).toContain('href="/vendor/notifications"')
  })

  it('shows the portal idle message when there are no rows', () => {
    const html = render([], 0)
    expect(html).toContain('You are all caught up')
    expect(html).toContain('New trips, payouts and reviews will show up here.')
  })

  it('shows a skeleton and no rows while loading', () => {
    const html = render([make({})], 1, true)
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('Loading notifications')
    expect(html).not.toContain('notif-row')
  })

  it('caps the badge at 9+', () => {
    expect(render([make({})], 14)).toContain('aria-hidden="true">9+<')
  })
})
