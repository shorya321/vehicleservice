import type { NextConfig } from 'next'
import { buildSecurityHeaders } from './lib/security/headers'
import { getSiteUrl } from './lib/seo/site-url'

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // The framework banner only helps someone fingerprint the stack.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: buildSecurityHeaders({
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          siteUrl: getSiteUrl(),
          isDev: process.env.NODE_ENV !== 'production',
        }),
      },
    ]
  },
  // nodemailer resolves its transport modules with dynamic require(), which bundlers
  // cannot trace statically. Bundling it produces confusing "cannot find module"
  // errors at runtime rather than at build time.
  // Forme (PDF engine) reads its .wasm with readFileSync relative to its own folder, which
  // breaks once bundled. Both packages stay external together: Forme recognises its own
  // primitives by identity, so the renderer and the components must be the same instance.
  serverExternalPackages: ['nodemailer', '@formepdf/core', '@formepdf/react'],
  // sharp's native libvips is loaded through the OS linker (@rpath / .so), not require(), so
  // standalone file tracing copies sharp's loader but not the library itself. Coolify runs the
  // standalone build; without this the quotation PDF cannot downsize vehicle photos.
  outputFileTracingIncludes: {
    '/api/business/quotations/**': ['./node_modules/@img/sharp-libvips-*/lib/**/*'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'motion/react'],
  },
  // /search/route/{country}/{slug} was removed: it was built on columns that never
  // existed and always returned 404. Old links land on the live route page, which
  // sends a visitor without a date to the search form.
  async redirects() {
    return [
      {
        source: '/search/route/:country/:routeSlug',
        destination: '/search/:routeSlug',
        permanent: true,
      },
      // Common URL guesses that 404'd in the Nov 2026 audit, sent to the page that
      // already holds the content. A redirect wins over a page: remove the alias
      // here before creating an admin page at the same URL.
      { source: '/fleet', destination: '/#fleet', permanent: true },
      { source: '/partner', destination: '/become-vendor', permanent: true },
      { source: '/terms-and-conditions', destination: '/terms', permanent: true },
      { source: '/privacy-policy', destination: '/privacy', permanent: true },
      { source: '/cookie-policy', destination: '/privacy#cookies-and-tracking', permanent: true },
      { source: '/refund-policy', destination: '/terms#cancellation-and-refund', permanent: true },
      { source: '/cancellation-policy', destination: '/terms#cancellation-and-refund', permanent: true },
    ]
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fnrlzhrchuoiwwsugidz.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
