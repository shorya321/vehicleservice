import {
  classifyNavigation,
  classifyLinkClick,
  labelFromAnchor,
  flattenNavLabels,
  labelForPath,
  type AnchorSnapshot,
  type ClickSnapshot,
} from '@/components/layout/navigation-progress/classify-navigation'

const CURRENT = 'http://localhost:3001/admin/bookings?status=pending'

const leftClick: ClickSnapshot = {
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
}

const anchor = (overrides: Partial<AnchorSnapshot> = {}): AnchorSnapshot => ({
  href: 'http://localhost:3001/admin/vendors',
  target: null,
  download: false,
  optOut: false,
  insideNestedControl: false,
  ...overrides,
})

describe('classifyNavigation', () => {
  it('treats a different pathname as a page change', () => {
    expect(classifyNavigation('/admin/vendors', CURRENT)).toBe('page')
  })

  it('treats a nested detail route as a page change', () => {
    expect(classifyNavigation('/admin/bookings/123', CURRENT)).toBe('page')
  })

  it('treats a query-only change as a query change', () => {
    expect(classifyNavigation('/admin/bookings?status=done', CURRENT)).toBe('query')
    expect(classifyNavigation('?page=2', CURRENT)).toBe('query')
  })

  it('ignores the exact same URL', () => {
    expect(classifyNavigation('/admin/bookings?status=pending', CURRENT)).toBeNull()
  })

  it('ignores a hash-only change', () => {
    expect(classifyNavigation('#section', CURRENT)).toBeNull()
    expect(classifyNavigation('/admin/bookings?status=pending#top', CURRENT)).toBeNull()
  })

  it('ignores another origin', () => {
    expect(classifyNavigation('https://example.com/admin', CURRENT)).toBeNull()
  })

  it('ignores non-http schemes', () => {
    expect(classifyNavigation('mailto:a@b.com', CURRENT)).toBeNull()
    expect(classifyNavigation('tel:+971500000000', CURRENT)).toBeNull()
  })
})

describe('classifyLinkClick', () => {
  it('tracks a plain left click on an internal link', () => {
    expect(classifyLinkClick(leftClick, anchor(), CURRENT)).toBe('page')
  })

  it('skips modifier clicks, which open a new tab or window', () => {
    for (const key of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey'] as const) {
      expect(classifyLinkClick({ ...leftClick, [key]: true }, anchor(), CURRENT)).toBeNull()
    }
  })

  it('skips a middle or right click', () => {
    expect(classifyLinkClick({ ...leftClick, button: 1 }, anchor(), CURRENT)).toBeNull()
    expect(classifyLinkClick({ ...leftClick, button: 2 }, anchor(), CURRENT)).toBeNull()
  })

  it('skips links that open elsewhere or download', () => {
    expect(classifyLinkClick(leftClick, anchor({ target: '_blank' }), CURRENT)).toBeNull()
    expect(classifyLinkClick(leftClick, anchor({ download: true }), CURRENT)).toBeNull()
  })

  it('keeps target=_self links', () => {
    expect(classifyLinkClick(leftClick, anchor({ target: '_self' }), CURRENT)).toBe('page')
  })

  it('skips opted-out links and clicks on a control nested inside the link', () => {
    expect(classifyLinkClick(leftClick, anchor({ optOut: true }), CURRENT)).toBeNull()
    expect(classifyLinkClick(leftClick, anchor({ insideNestedControl: true }), CURRENT)).toBeNull()
  })

  it('skips the current page', () => {
    expect(
      classifyLinkClick(leftClick, anchor({ href: CURRENT }), CURRENT)
    ).toBeNull()
  })

  it('reports a query-only link as a query change', () => {
    expect(
      classifyLinkClick(leftClick, anchor({ href: '/admin/bookings?page=2' }), CURRENT)
    ).toBe('query')
  })
})

describe('labelFromAnchor', () => {
  it('prefers data-nav-label', () => {
    expect(labelFromAnchor({ dataLabel: 'Bookings', ariaLabel: 'Go', text: 'Bookings 3 NEW' })).toBe('Bookings')
  })

  it('falls back to aria-label, then the visible text', () => {
    expect(labelFromAnchor({ dataLabel: null, ariaLabel: 'Vendors', text: 'x' })).toBe('Vendors')
    expect(labelFromAnchor({ dataLabel: null, ariaLabel: null, text: '  Drivers \n ' })).toBe('Drivers')
  })

  it('collapses whitespace and returns null when nothing usable is left', () => {
    expect(labelFromAnchor({ dataLabel: '', ariaLabel: ' ', text: 'My   Account' })).toBe('My Account')
    expect(labelFromAnchor({ dataLabel: null, ariaLabel: null, text: '   ' })).toBeNull()
  })

  it('drops labels too long to read as a page name', () => {
    expect(labelFromAnchor({ dataLabel: null, ariaLabel: null, text: 'a'.repeat(61) })).toBeNull()
  })
})

describe('flattenNavLabels', () => {
  it('lists top-level items and submenu items', () => {
    const entries = flattenNavLabels([
      { items: [{ name: 'Dashboard', href: '/admin/dashboard' }] },
      {
        items: [
          {
            name: 'Blog',
            href: '/admin/blog',
            submenu: [
              { name: 'Posts', href: '/admin/blog/posts' },
              { name: 'Categories', href: '/admin/blog/categories' },
            ],
          },
        ],
      },
    ])
    expect(entries).toEqual([
      { href: '/admin/dashboard', label: 'Dashboard' },
      { href: '/admin/blog', label: 'Blog' },
      { href: '/admin/blog/posts', label: 'Posts' },
      { href: '/admin/blog/categories', label: 'Categories' },
    ])
  })
})

describe('labelForPath', () => {
  const entries = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/bookings', label: 'Bookings' },
    { href: '/admin/blog', label: 'Blog' },
    { href: '/admin/blog/posts', label: 'Posts' },
  ]

  it('matches an exact section', () => {
    expect(labelForPath('/admin/bookings', entries)).toBe('Bookings')
  })

  it('names a detail page after its section', () => {
    expect(labelForPath('/admin/bookings/abc-123', entries)).toBe('Bookings')
  })

  it('prefers the longest matching section', () => {
    expect(labelForPath('/admin/blog/posts/new', entries)).toBe('Posts')
  })

  it('does not match on a shared prefix that is not a path segment', () => {
    expect(labelForPath('/admin/bookings-archive', entries)).toBeNull()
  })

  it('resolves full URLs and ignores the query', () => {
    expect(labelForPath('/admin/bookings?status=done', entries)).toBe('Bookings')
  })

  it('returns null for an unknown path', () => {
    expect(labelForPath('/admin/unknown', entries)).toBeNull()
  })
})
