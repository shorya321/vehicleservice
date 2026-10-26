import type { Metadata } from 'next'
import { headers } from 'next/headers'

// Platform favicon set in public/brand/. Copied rather than imported, so the
// business module keeps no dependency on the main site's code.
const PLATFORM_ICONS: Metadata['icons'] = {
  icon: [
    { url: '/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
    { url: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
  ],
  apple: '/brand/apple-touch-icon.png',
}

/**
 * Same test proxy.ts uses to tell the platform from a tenant: anything that is
 * not the NEXT_PUBLIC_SITE_URL host is a business subdomain or custom domain.
 */
function isPlatformHost(host: string | null): boolean {
  if (!host) return false
  const platformHost = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001').hostname
  return host.split(':')[0].toLowerCase() === platformHost.toLowerCase()
}

/**
 * Business portals are white-label, so tenant domains get no platform icon.
 * On the platform's own domain (its /business/login, signup and so on) the
 * platform icon is correct. Signed-in portal pages replace this with the
 * tenant's own icon in (portal)/layout.tsx.
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const host = (await headers()).get('host')
    return { icons: isPlatformHost(host) ? PLATFORM_ICONS : null }
  } catch {
    return { icons: null }
  }
}

export default function BusinessLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return children
}
