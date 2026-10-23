/**
 * The header status chip and profile menu shared by the admin and vendor
 * portals. Pins the status mapping (a vendor with an unknown status gets no
 * chip rather than an invented one) and the rendered menu, so a restyle
 * cannot drop the account links, the role or sign out.
 * Radix dropdown and avatar are swapped for inline elements because the real
 * ones portal or defer their content and render nothing on the server.
 */
import { jsx } from 'react/jsx-runtime'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Settings, User } from 'lucide-react'
import {
  adminSiteStatus,
  initialsFor,
  vendorProfileStatus,
} from '@/lib/portal-header/controls'

jest.mock('@/components/ui/dropdown-menu', () => {
  const { jsx: j } = jest.requireActual('react/jsx-runtime')
  const pass = ({ children }: { children?: ReactNode }) => j('div', { children })
  return {
    DropdownMenu: pass,
    DropdownMenuTrigger: pass,
    DropdownMenuContent: ({ children, className }: { children?: ReactNode; className?: string }) =>
      j('div', { role: 'menu', className, children }),
    DropdownMenuItem: ({ children, className }: { children?: ReactNode; className?: string }) =>
      j('div', { role: 'menuitem', className, children }),
    DropdownMenuSeparator: () => j('hr', {}),
  }
})

jest.mock('@/components/ui/avatar', () => {
  const { jsx: j } = jest.requireActual('react/jsx-runtime')
  return {
    Avatar: ({ children }: { children?: ReactNode }) => j('span', { children }),
    AvatarImage: ({ src }: { src?: string }) => j('img', { src, alt: '' }),
    AvatarFallback: ({ children }: { children?: ReactNode }) => j('span', { children }),
  }
})

jest.mock('next/link', () => {
  const { jsx: j } = jest.requireActual('react/jsx-runtime')
  return {
    __esModule: true,
    default: ({ href, children, className }: { href: string; children?: ReactNode; className?: string }) =>
      j('a', { href, className, children }),
  }
})

import { StatusChip } from '@/components/admin/header/status-chip'
import { ProfileMenu } from '@/components/admin/header/profile-menu'

describe('adminSiteStatus', () => {
  it('reads live when maintenance is off', () => {
    expect(adminSiteStatus(false)).toEqual({ label: 'Site live', tone: 'ok', href: '/admin/settings' })
  })

  it('warns when maintenance is on', () => {
    expect(adminSiteStatus(true)).toMatchObject({ label: 'Maintenance on', tone: 'warn' })
  })
})

describe('vendorProfileStatus', () => {
  it.each([
    ['approved', 'Profile active', 'ok'],
    ['pending', 'Profile pending', 'warn'],
    ['rejected', 'Profile rejected', 'danger'],
  ])('maps %s', (status, label, tone) => {
    expect(vendorProfileStatus(status)).toEqual({ label, tone, href: '/vendor/profile' })
  })

  it('shows nothing for a missing or unknown status', () => {
    expect(vendorProfileStatus(undefined)).toBeNull()
    expect(vendorProfileStatus(null)).toBeNull()
    expect(vendorProfileStatus('suspended')).toBeNull()
  })
})

describe('initialsFor', () => {
  it('uses the first letters of up to two names', () => {
    expect(initialsFor('Vikram  Singh Rathore', 'v@x.com')).toBe('VS')
  })

  it('falls back to the email, then U', () => {
    expect(initialsFor('  ', 'anshul@x.com')).toBe('AN')
    expect(initialsFor(null, null)).toBe('U')
  })
})

describe('StatusChip', () => {
  it('renders the label, tone and link', () => {
    const html = renderToStaticMarkup(jsx(StatusChip, { status: adminSiteStatus(true) }))
    expect(html).toContain('href="/admin/settings"')
    expect(html).toContain('hdr-chip--warn')
    expect(html).toContain('Maintenance on')
  })

  it('renders nothing without a status', () => {
    expect(renderToStaticMarkup(jsx(StatusChip, { status: null }))).toBe('')
  })
})

describe('ProfileMenu', () => {
  const base = {
    name: 'Vikram Singh',
    email: 'admin@example.com',
    avatarUrl: null,
    roleLabel: 'Administrator',
    fallbackName: 'Admin User',
    links: [
      { href: '/admin/profile', label: 'Profile settings', icon: User },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
    onSignOut: jest.fn(),
  }

  it('shows identity, role, links and sign out', () => {
    const html = renderToStaticMarkup(jsx(ProfileMenu, base))
    expect(html).toContain('aria-label="Account menu"')
    expect(html).toContain('Vikram Singh')
    expect(html).toContain('admin@example.com')
    expect(html).toContain('Administrator')
    expect(html).toContain('href="/admin/profile"')
    expect(html).toContain('href="/admin/settings"')
    expect(html).toContain('Sign out')
    expect(html).not.toContain('Support')
  })

  it('shows the photo when there is one and initials otherwise', () => {
    const withPhoto = renderToStaticMarkup(jsx(ProfileMenu, { ...base, avatarUrl: 'https://x/a.png' }))
    expect(withPhoto).toContain('src="https://x/a.png"')
    const without = renderToStaticMarkup(jsx(ProfileMenu, base))
    expect(without).not.toContain('<img')
    expect(without).toContain('>VS<')
  })

  it('falls back to the portal name when the profile has none', () => {
    const html = renderToStaticMarkup(jsx(ProfileMenu, { ...base, name: null }))
    expect(html).toContain('Admin User')
  })
})
