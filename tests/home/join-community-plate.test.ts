/**
 * The home "Your account" section. Pins the two links (the old "Sign in" pointed
 * at /auth/login, which has no page), the four checklist rows and the sample
 * route card, which must stay one labelled image and never claim live tracking.
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

  it('lists four benefits, each with a title and an icon', () => {
    const html = render()
    expect(html.match(/<li\b/g)).toHaveLength(4)
    expect(html.match(/account-plate__icon/g)).toHaveLength(4)
    for (const title of ['Details on file', 'Rebook in two taps', 'Every trip on record', 'Priority support']) {
      expect(html).toContain(`<b class="editorial-list-title">${title}</b>`)
    }
  })

  it('renders the saved route as one labelled image', () => {
    expect(render()).toContain('role="img" aria-label="Sample saved route from DXB Terminal 3 to Palm Jumeirah"')
  })

  it('never frames the route as live tracking, which customers do not have', () => {
    expect(withoutSvg(render())).not.toMatch(/live|track/i)
  })

  it('carries no em dash, en dash, ellipsis or curly quote', () => {
    expect(withoutSvg(render())).not.toMatch(/[–—…‘’“”]/)
  })
})
