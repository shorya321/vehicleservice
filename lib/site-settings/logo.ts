import type { SiteSettingsConfig } from './types'

/** Bundled Infinia artwork in `public/brand/`, used when a slot has no upload. */
export const BUILT_IN_LOGOS = {
  horizontal: {
    light: '/brand/logo-horizontal-light.png',
    dark: '/brand/logo-horizontal-dark.png',
    width: 791,
    height: 160,
  },
  stacked: {
    light: '/brand/logo-stacked-light.png',
    dark: '/brand/logo-stacked-dark.png',
    width: 639,
    height: 400,
  },
} as const

export type LogoSlot = 'header' | 'footer' | 'admin'

export interface ResolvedLogo {
  light: string
  dark: string
  /** Intrinsic size hint for next/image. Uploads have no known size. */
  width: number
  height: number
  /** True when the admin uploaded either theme's file for this slot. */
  custom: boolean
}

/** Admin and vendor sidebar logo, plus the mark shown when the sidebar is collapsed. */
export interface PortalLogo extends ResolvedLogo {
  /** The favicon upload, else the gold Infinia mark. */
  mark: string
}

const SLOT_ARTWORK = { header: 'horizontal', footer: 'stacked', admin: 'horizontal' } as const

/**
 * The file each theme shows for a slot. One upload fills both themes, so a
 * logo uploaded before dark uploads existed keeps showing exactly as it did.
 */
export type LogoSettings = Pick<
  SiteSettingsConfig,
  | 'header_logo_url'
  | 'header_logo_dark_url'
  | 'footer_logo_url'
  | 'footer_logo_dark_url'
  | 'admin_logo_url'
  | 'admin_logo_dark_url'
>

const SLOT_FIELDS = {
  header: { light: 'header_logo_url', dark: 'header_logo_dark_url', width: 160, height: 40 },
  footer: { light: 'footer_logo_url', dark: 'footer_logo_dark_url', width: 180, height: 48 },
  admin: { light: 'admin_logo_url', dark: 'admin_logo_dark_url', width: 160, height: 40 },
} as const satisfies Record<LogoSlot, { light: keyof LogoSettings; dark: keyof LogoSettings; width: number; height: number }>

export function resolveSiteLogo(settings: LogoSettings, slot: LogoSlot): ResolvedLogo {
  const fields = SLOT_FIELDS[slot]
  // `?? null` keeps settings saved before a slot existed reading as "no upload".
  const light = settings[fields.light] ?? null
  const dark = settings[fields.dark] ?? null

  if (light || dark) {
    return {
      light: light ?? dark ?? '',
      dark: dark ?? light ?? '',
      width: fields.width,
      height: fields.height,
      custom: true,
    }
  }

  return builtInLogo(SLOT_ARTWORK[slot])
}

/** Bundled artwork in a given shape, for screens that pick their own layout. */
export function builtInLogo(variant: keyof typeof BUILT_IN_LOGOS): ResolvedLogo {
  const artwork = BUILT_IN_LOGOS[variant]
  return { light: artwork.light, dark: artwork.dark, width: artwork.width, height: artwork.height, custom: false }
}

/** Bundled favicon set in `public/brand/`, cut from the gold mark. */
export const BUILT_IN_FAVICON = {
  icon32: '/brand/favicon-32.png',
  icon192: '/brand/icon-192.png',
  apple: '/brand/apple-touch-icon.png',
} as const

interface FaviconIcons {
  icon: { url: string; sizes?: string; type?: string }[]
  apple: string
}

/**
 * Links for the root layout's `metadata.icons`. Declared as links rather than a
 * `public/favicon.ico`, because browsers fetch that file on any page with no
 * icon link, which would put this icon on white-label business domains.
 */
export function faviconIcons(settings: Pick<SiteSettingsConfig, 'favicon_url'>): FaviconIcons {
  if (settings.favicon_url) {
    return { icon: [{ url: settings.favicon_url }], apple: settings.favicon_url }
  }
  return {
    icon: [
      { url: BUILT_IN_FAVICON.icon32, sizes: '32x32', type: 'image/png' },
      { url: BUILT_IN_FAVICON.icon192, sizes: '192x192', type: 'image/png' },
    ],
    apple: BUILT_IN_FAVICON.apple,
  }
}
