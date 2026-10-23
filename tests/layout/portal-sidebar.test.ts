/**
 * The sidebar shared by the admin and vendor portals. Pins the active-page
 * rules (segment-aware, so /admin/vehicles never lights up on a sibling
 * route), which parent opens for the current page, the count pills, and the
 * rendered sidebar: every nav link, the brand, View site and the collapse
 * control, so a restyle cannot drop a page from the navigation.
 */
import { jsx } from 'react/jsx-runtime'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Calendar, Car, Settings } from 'lucide-react'
import {
  activeParentNames,
  countLabel,
  isItemActive,
  matchesPath,
  submenuHasCount,
  type PortalNavGroup,
} from '@/lib/portal-sidebar/nav'

let mockPathname = '/admin/vehicles'
jest.mock('next/navigation', () => ({ usePathname: () => mockPathname }))

jest.mock('next/link', () => {
  const { jsx: j } = jest.requireActual('react/jsx-runtime')
  return {
    __esModule: true,
    default: ({ href, children, ...rest }: { href: string; children?: ReactNode }) =>
      j('a', { href, ...rest, children }),
  }
})

import { PortalSidebar } from '@/components/layout/portal-sidebar/portal-sidebar'
import { navGroups as adminNavGroups } from '@/components/layout/sidebar'

const groups: PortalNavGroup[] = [
  { label: 'Management', items: [
    { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
    {
      name: 'Vehicles',
      href: '/admin/vehicles',
      icon: Car,
      submenu: [
        { name: 'All Vehicles', href: '/admin/vehicles' },
        { name: 'Vehicle Types', href: '/admin/vehicle-types' },
      ],
    },
  ] },
  { label: 'Settings', items: [
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      submenu: [
        { name: 'General', href: '/admin/settings' },
        { name: 'Notifications', href: '/admin/notifications' },
      ],
    },
  ] },
]

const brand = { href: '/admin/dashboard', subtitle: 'Admin Panel', icon: Car }

function render(props: Partial<Parameters<typeof PortalSidebar>[0]> = {}): string {
  return renderToStaticMarkup(
    jsx(PortalSidebar, { groups, brand, rail: false, canRail: true, onToggleRail: jest.fn(), ...props })
  )
}

describe('matchesPath', () => {
  it('matches the page and its children only', () => {
    expect(matchesPath('/admin/vehicles', '/admin/vehicles')).toBe(true)
    expect(matchesPath('/admin/vehicles/12/edit', '/admin/vehicles')).toBe(true)
    expect(matchesPath('/admin/vehicle-types', '/admin/vehicles')).toBe(false)
    expect(matchesPath('/admin/vehiclesx', '/admin/vehicles')).toBe(false)
  })
})

describe('isItemActive', () => {
  it('lights a plain link on its detail pages', () => {
    expect(isItemActive('/admin/bookings/42', groups[0].items[0])).toBe(true)
  })

  it('lights a submenu parent through any child', () => {
    expect(isItemActive('/admin/vehicle-types', groups[0].items[1])).toBe(true)
    expect(isItemActive('/admin/bookings', groups[0].items[1])).toBe(false)
  })
})

describe('activeParentNames', () => {
  it('opens only the parent that holds the page', () => {
    expect(activeParentNames(groups, '/admin/notifications')).toEqual(['Settings'])
    expect(activeParentNames(groups, '/admin/bookings')).toEqual([])
  })
})

describe('countLabel and submenuHasCount', () => {
  it('hides zero and caps at 9+', () => {
    expect(countLabel(0)).toBeNull()
    expect(countLabel(undefined)).toBeNull()
    expect(countLabel(3)).toBe('3')
    expect(countLabel(12)).toBe('9+')
  })

  it('finds a count on a child', () => {
    expect(submenuHasCount(groups[1].items[0], { '/admin/notifications': 2 })).toBe(true)
    expect(submenuHasCount(groups[1].items[0], { '/admin/notifications': 0 })).toBe(false)
  })
})

describe('PortalSidebar', () => {
  beforeEach(() => {
    mockPathname = '/admin/vehicles'
  })

  it('renders the brand, group labels, View site and Collapse', () => {
    const html = render()
    expect(html).toContain('VehicleService')
    expect(html).toContain('Admin Panel')
    expect(html).toContain('Management')
    expect(html).toContain('href="/"')
    expect(html).toContain('View site')
    expect(html).toContain('aria-label="Collapse sidebar"')
  })

  it('opens the parent of the current page and marks only the child current', () => {
    const html = render()
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('psb-row--parent-on')
    expect(html).toMatch(/<a href="\/admin\/vehicles" aria-current="page" class="psb-sub psb-sub--on"/)
    expect(html).not.toContain('psb-row--on')
    expect(html).toContain('href="/admin/vehicle-types"')
  })

  it('shows a child count when its parent is open and a dot when closed', () => {
    mockPathname = '/admin/notifications'
    expect(render({ counts: { '/admin/notifications': 3 } })).toContain('<span class="psb-count">3</span>')
    mockPathname = '/admin/bookings'
    const closed = render({ counts: { '/admin/notifications': 3 } })
    expect(closed).toContain('psb-row__dot')
    expect(closed).not.toContain('psb-count')
  })

  it('collapses to icon links with names as labels', () => {
    const html = render({ rail: true })
    expect(html).toContain('psb--rail')
    expect(html).toContain('aria-label="Vehicles"')
    expect(html).toContain('href="/admin/vehicles"')
    expect(html).not.toContain('Management')
    expect(html).toContain('aria-label="Expand sidebar"')
  })

  it('hides the collapse control where the rail cannot apply', () => {
    expect(render({ canRail: false })).not.toContain('Collapse sidebar')
  })

  it('renders a close button only when given one', () => {
    expect(render()).not.toContain('Close navigation')
    expect(render({ onClose: jest.fn() })).toContain('aria-label="Close navigation"')
  })
})

describe('admin navGroups', () => {
  it('keeps every admin page reachable', () => {
    mockPathname = '/admin/dashboard'
    const html = renderToStaticMarkup(
      jsx(PortalSidebar, { groups: adminNavGroups, brand, rail: true, canRail: true, onToggleRail: jest.fn() })
    )
    for (const item of adminNavGroups.flatMap((g) => g.items)) {
      expect(html).toContain(`href="${item.href}"`)
    }
  })
})
