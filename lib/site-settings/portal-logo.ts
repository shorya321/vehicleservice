import 'server-only'
import { getSiteSettings } from './server'
import { BUILT_IN_FAVICON, builtInLogo, resolveSiteLogo, type PortalLogo } from './logo'

/**
 * The logo for the admin and vendor portal sidebars. Never throws: a settings
 * read failure falls back to the bundled Infinia artwork so the portal shell
 * always renders.
 */
export async function getPortalLogo(): Promise<PortalLogo> {
  try {
    const settings = await getSiteSettings()
    return { ...resolveSiteLogo(settings, 'admin'), mark: settings.favicon_url ?? BUILT_IN_FAVICON.icon192 }
  } catch (error) {
    console.error('[SiteSettings] Error resolving portal logo:', error)
    return { ...builtInLogo('horizontal'), mark: BUILT_IN_FAVICON.icon192 }
  }
}
