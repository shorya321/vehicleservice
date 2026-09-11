/**
 * The home "Your account" plate. Pins the two links (the old "Sign in" pointed
 * at /auth/login, which has no page) and the four numbered benefits.
 */
import { jsx } from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { JoinCommunityPlate } from '@/components/home/join-community-plate'

const render = (): string => renderToStaticMarkup(jsx(JoinCommunityPlate, {}))

/** Icon path data carries arbitrary characters, so drop it first. */
const withoutSvg = (html: string): string => html.replace(/<svg[\s\S]*?<\/svg>/g, '')

describe('JoinCommunityPlate', () => {
  it('labels the section heading for aria-labelledby', () => {
    expect(render()).toContain('id="membership-heading"')
  })

  it('links signup to /register and sign in to /login', () => {
    const html = render()
    expect(html).toContain('href="/register"')
    expect(html).toContain('href="/login"')
  })

  it('never links to /auth/login, which has no page', () => {
    expect(render()).not.toContain('/auth/login')
  })

  it('lists four benefits numbered 01 to 04', () => {
    const html = render()
    expect(html.match(/<li\b/g)).toHaveLength(4)
    for (const n of ['01', '02', '03', '04']) {
      expect(html).toContain(`>${n}<`)
    }
  })

  it('carries no em dash, en dash or ellipsis', () => {
    expect(withoutSvg(render())).not.toMatch(/[–—…]/)
  })
})
