/**
 * The header account dropdown. Pins the role branching, the routes each row
 * links to, and the sign-out row, so restyling the menu cannot drop a link.
 * The Radix primitives are swapped for inline elements because the real menu
 * portals its content and renders nothing on the server while closed.
 */
import { jsx } from 'react/jsx-runtime'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { User } from '@supabase/supabase-js'
import type { HeaderProfile } from '@/components/layout/header-profile'

jest.mock('@/components/ui/dropdown-menu', () => {
  const { jsx: j } = jest.requireActual('react/jsx-runtime')
  const pass = (tag: string) => ({ children, asChild, className, onClick }: {
    children?: ReactNode; asChild?: boolean; className?: string; onClick?: () => void
  }) => j(asChild ? 'span' : tag, { className, 'data-onclick': onClick ? 'yes' : undefined, children })
  return {
    DropdownMenu: pass('div'),
    DropdownMenuTrigger: pass('div'),
    DropdownMenuContent: pass('div'),
    DropdownMenuItem: pass('div'),
    DropdownMenuLabel: pass('div'),
    DropdownMenuSeparator: pass('hr'),
  }
})

import { AccountMenu } from '@/components/layout/account-menu'

const USER = { id: 'u1', email: 'anshul@example.com' } as User

const render = (role: string | null, fullName: string | null = 'Anshul Mankotia'): string => {
  const profile: HeaderProfile | null =
    role === null ? null : ({ id: 'u1', full_name: fullName, avatar_url: null, role } as HeaderProfile)
  return renderToStaticMarkup(jsx(AccountMenu, { user: USER, profile, initials: 'AM', onSignOut: () => {} }))
}

const CUSTOMER_LINKS = ['/account?tab=personal', '/account?tab=bookings', '/account?tab=reviews', '/become-vendor']

describe('AccountMenu', () => {
  it('gives customers their four account links', () => {
    const html = render('customer')
    for (const href of CUSTOMER_LINKS) expect(html).toContain(`href="${href}"`)
    expect(html).not.toContain('Go to Dashboard')
  })

  it('treats a missing profile as a customer', () => {
    const html = render(null)
    for (const href of CUSTOMER_LINKS) expect(html).toContain(`href="${href}"`)
    expect(html).toContain('>User<')
  })

  it.each([
    ['admin', '/admin/dashboard'],
    ['vendor', '/vendor/dashboard'],
    ['business', '/business/dashboard'],
  ])('sends %s to %s only', (role, path) => {
    const html = render(role)
    expect(html).toContain(`href="${path}"`)
    for (const href of CUSTOMER_LINKS) expect(html).not.toContain(`href="${href}"`)
  })

  it('always shows the identity and a wired sign-out row', () => {
    const html = render('vendor')
    expect(html).toContain('Anshul Mankotia')
    expect(html).toContain('anshul@example.com')
    expect(html).toMatch(/data-onclick="yes"[^>]*>[\s\S]*Sign out/)
  })

  it('uses the 44px row height on every row', () => {
    const rows = render('customer').match(/min-h-\[44px\]/g) ?? []
    expect(rows).toHaveLength(CUSTOMER_LINKS.length + 1)
  })
})
