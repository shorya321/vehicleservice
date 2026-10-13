import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // nodemailer resolves its transport modules with dynamic require(), which bundlers
  // cannot trace statically. Bundling it produces confusing "cannot find module"
  // errors at runtime rather than at build time.
  serverExternalPackages: ['nodemailer'],
  // sharp's native libvips is loaded through the OS linker (@rpath / .so), not require(), so
  // standalone file tracing copies sharp's loader but not the library itself. Coolify runs the
  // standalone build; without this the quotation PDF cannot downsize vehicle photos.
  outputFileTracingIncludes: {
    '/api/business/quotations/**': ['./node_modules/@img/sharp-libvips-*/lib/**/*'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'motion/react'],
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
