import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { SiteSettingsConfig } from '@/lib/site-settings/types'
import {
  FOOTER_BLURB,
  FOOTER_GUARANTEES,
  FOOTER_LINK_CATEGORIES,
  SOCIAL_ICON_MAP,
} from './footer-data'

// `import * as React` is for jest: ts-jest compiles JSX with the classic
// runtime, which needs React in scope. Next itself uses the automatic runtime.

interface FooterPanelProps {
  settings: SiteSettingsConfig
}

// One focus treatment for the whole footer. The offset ground follows the
// footer's own tone step, or the ring would draw a hairline of the page colour.
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)]'

const LINK_CLASS = `footer-link rounded-[2px] ${FOCUS_RING}`

function Wordmark({ name }: { name: string }): React.JSX.Element {
  if (!name.includes(' ')) return <>{name}</>
  const words = name.split(' ')
  return (
    <>
      {words.slice(0, -1).join(' ')} <span>{words[words.length - 1]}</span>
    </>
  )
}

function FooterAnchor({ href, children }: { href: string; children: React.ReactNode }): React.JSX.Element {
  // Hash links stay plain anchors so the browser scrolls to the section.
  return href.includes('#') ? (
    <a href={href} className={LINK_CLASS}>{children}</a>
  ) : (
    <Link href={href} className={LINK_CLASS}>{children}</Link>
  )
}

function Socials({ links }: { links: SiteSettingsConfig['social_links'] }): React.JSX.Element | null {
  // Filtered on an icon existing, not just on a URL being set. A configured
  // platform with no glyph (tiktok) would otherwise render nothing, silently.
  const entries = Object.entries(links).filter(
    ([platform, url]) => url && url.length > 0 && SOCIAL_ICON_MAP[platform]
  )
  if (entries.length === 0) return null
  return (
    <ul className="site-footer__social">
      {entries.map(([platform, url]) => {
        const Icon = SOCIAL_ICON_MAP[platform]
        return (
          <li key={platform}>
            {/* 44px tap target wrapping the 36px drawn box. */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${FOCUS_RING}`}
              aria-label={platform.charAt(0).toUpperCase() + platform.slice(1)}
            >
              <span className="footer-social">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Footer body, markup only, so it renders under test. The <footer> landmark
 * and the reveal live in ./footer.tsx. Follows the Corridor reference: brand
 * and three link columns, three outlined guarantee cards, then one bottom row.
 * See `.site-footer` in app/globals.css.
 */
export function FooterPanel({ settings }: FooterPanelProps): React.JSX.Element {
  return (
    <>
      <div className="site-footer__top">
        <div>
          <Link
            href="/"
            aria-label={`${settings.brand_name}, go to homepage`}
            className={`footer-logo footer-wordmark inline-block rounded-[4px] ${FOCUS_RING}`}
          >
            {settings.footer_logo_url ? (
              <Image
                src={settings.footer_logo_url}
                alt={settings.brand_name}
                width={180}
                height={48}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <Wordmark name={settings.brand_name} />
            )}
          </Link>
          <p className="site-footer__blurb">{FOOTER_BLURB}</p>
        </div>

        {FOOTER_LINK_CATEGORIES.map((category) => (
          <div key={category.title}>
            <h4 className="site-footer__head">{category.title}</h4>
            <ul className="site-footer__list">
              {category.links.map((link) => (
                <li key={link.name}>
                  <FooterAnchor href={link.href}>{link.name}</FooterAnchor>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="site-footer__head">Contact</h4>
          <ul className="site-footer__list">
            <li>
              <a
                href={`tel:${settings.support_phone.replace(/\s/g, '')}`}
                aria-label="Call reservations"
                className={`${LINK_CLASS} numeric`}
              >
                {settings.support_phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${settings.support_email}`} aria-label="Email support" className={LINK_CLASS}>
                {settings.support_email}
              </a>
            </li>
            {settings.office_address ? (
              <li>
                <address className="site-footer__address">{settings.office_address}</address>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      {/* Three contractual promises, drawn as outlines like the FAQ cards. */}
      <div className="site-footer__guarantees">
        {FOOTER_GUARANTEES.map((item) => (
          <div key={item.label} className="site-footer__card">
            <h3 className="site-footer__card-label">{item.label}</h3>
            <p>{item.body}</p>
          </div>
        ))}
      </div>

      <div className="site-footer__bottom">
        <p className="site-footer__meta numeric" suppressHydrationWarning>
          &copy; {new Date().getFullYear()} {settings.copyright_text}
        </p>
        <div className="site-footer__end">
          <nav aria-label="Legal" className="site-footer__legal">
            <Link href="/privacy" className={LINK_CLASS}>Privacy</Link>
            <span aria-hidden="true">&middot;</span>
            <Link href="/terms" className={LINK_CLASS}>Terms</Link>
          </nav>
          <Socials links={settings.social_links} />
        </div>
      </div>
    </>
  )
}
