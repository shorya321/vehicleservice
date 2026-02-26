import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { detectCurrencyFromAcceptLanguage, isValidCurrencyCode } from '@/lib/currency/detect'
import { CURRENCY_COOKIE_NAME, CURRENCY_COOKIE_MAX_AGE } from '@/lib/currency/types'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request,
  })

  // Currency preference handling
  const currencyCookie = request.cookies.get(CURRENCY_COOKIE_NAME)
  if (!currencyCookie?.value) {
    // No currency preference set - detect from Accept-Language
    const acceptLanguage = request.headers.get('accept-language')
    const detectedCurrency = detectCurrencyFromAcceptLanguage(acceptLanguage)

    // Set cookie with detected currency
    response.cookies.set(CURRENCY_COOKIE_NAME, detectedCurrency, {
      maxAge: CURRENCY_COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
    })
  } else if (!isValidCurrencyCode(currencyCookie.value)) {
    // Invalid currency in cookie - reset to detected
    const acceptLanguage = request.headers.get('accept-language')
    const detectedCurrency = detectCurrencyFromAcceptLanguage(acceptLanguage)

    response.cookies.set(CURRENCY_COOKIE_NAME, detectedCurrency, {
      maxAge: CURRENCY_COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
    })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Only set cookies on the response (request cookies are read-only)
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  let user = null
  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser()
    if (error) {
      console.warn('Middleware auth error:', error.message)
    }
    user = authUser
  } catch (error) {
    console.error('Middleware fetch error:', error)
  }

  // Domain-based business identification for white-labeling
  const hostname = request.headers.get('host') || request.nextUrl.hostname
  const platformDomain = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001').hostname

  // Track if business exists for this domain
  let businessFound: { id: string; subdomain: string; custom_domain: string | null } | null = null

  // Check database for custom domain (query ALL non-main-platform domains)
  // Database is source of truth for custom domain detection
  if (hostname !== platformDomain && !hostname.startsWith(`${platformDomain}:`)) {
    try {
      // Query business by custom domain
      const { data: businessContext, error } = await supabase.rpc('get_business_by_custom_domain', {
        p_domain: hostname
      })

      if (!error && businessContext && businessContext.length > 0) {
        const business = businessContext[0]

        // Store business info for later subdomain validation
        businessFound = {
          id: business.id,
          subdomain: business.subdomain,
          custom_domain: business.custom_domain
        }

        // Inject business branding context into response headers
        response.headers.set('x-business-id', business.id)
        response.headers.set('x-business-name', business.business_name || '')
        response.headers.set('x-brand-name', business.brand_name || business.business_name || '')
        response.headers.set('x-logo-url', business.logo_url || '')

        // Extract colors from theme_config JSONB (new consolidated structure)
        // Falls back to defaults if theme_config is not set
        const themeConfig = business.theme_config as {
          accent?: { primary?: string; secondary?: string; tertiary?: string };
        } | null
        const primaryColor = themeConfig?.accent?.primary || '#C6AA88'
        const secondaryColor = themeConfig?.accent?.secondary || '#14B8A6'
        const accentColor = themeConfig?.accent?.tertiary || '#06B6D4'

        response.headers.set('x-primary-color', primaryColor)
        response.headers.set('x-secondary-color', secondaryColor)
        response.headers.set('x-accent-color', accentColor)
        response.headers.set('x-custom-domain', 'true')

        // Log domain identification
        console.log('Custom domain identified:', {
          hostname,
          businessId: business.id,
          businessName: business.business_name,
        })
      } else {
        // Custom domain not found or not verified
        console.warn('Custom domain not verified:', hostname)
      }
    } catch (error) {
      console.error('Error fetching business by custom domain:', error)
    }
  }

  // Custom domain route isolation for business multi-tenancy
  // Business subdomains and custom domains should ONLY show business portal routes
  // Apply route isolation if:
  // 1. Database found a business for this domain (custom domain), OR
  // 2. Domain follows subdomain pattern (business subdomain)

  // For subdomain detection, strip port number first (e.g., nature.localhost:3001 → nature.localhost)
  const hostnameWithoutPort = hostname.split(':')[0]
  const isSubdomainPattern = hostnameWithoutPort !== platformDomain &&
                             hostnameWithoutPort.endsWith(`.${platformDomain}`)
  const shouldApplyRouteIsolation = businessFound !== null || isSubdomainPattern

  if (shouldApplyRouteIsolation) {
    const pathname = request.nextUrl.pathname

    // Import helper functions
    const { isAllowedOnCustomDomain, getBusinessRedirectPath, isDevelopmentEnvironment } =
      await import('@/lib/business/domain-routing')

    // HYBRID SUBDOMAIN VALIDATION
    // Check if business exists for this subdomain/custom domain
    if (!businessFound) {
      // Business doesn't exist at this domain

      // In development (localhost), allow access for testing
      if (isDevelopmentEnvironment(hostname)) {
        console.log('Development mode: Allowing access to non-existent subdomain for testing')
        // Continue to normal flow
      } else {
        // In production, show "Business Not Found" page
        console.warn('Production: Business not found, redirecting to not-found page')
        return NextResponse.redirect(new URL('/business-not-found', request.url))
      }
    }

    // Root path - redirect to appropriate business entry point
    if (pathname === '/') {
      const redirectPath = getBusinessRedirectPath(!!user)
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }

    // Block signup routes on custom domains and subdomains
    // Signup should only be allowed on main platform domain
    // Business users must register on the main website first
    if (pathname.startsWith('/business/signup')) {
      console.log('Signup blocked on custom domain/subdomain, redirecting to login')
      return NextResponse.redirect(new URL('/business/login', request.url))
    }

    // Check if current path is allowed on custom domains
    if (!isAllowedOnCustomDomain(pathname)) {
      // Redirect disallowed routes to business portal
      const redirectPath = getBusinessRedirectPath(!!user)
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }

    // Path is allowed, continue to business portal routes
    // (will be handled by business authentication middleware below)
  }

  // Protected admin routes
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Check if user has admin role
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching admin profile:', error)
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      if (!profile || profile.role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    } catch (error) {
      console.error('Middleware profile fetch error:', error)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // Protected account routes (replaced customer routes)
  if (request.nextUrl.pathname.startsWith('/account') ||
      request.nextUrl.pathname.startsWith('/become-vendor') ||
      request.nextUrl.pathname.startsWith('/vendor-application')) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Restrict /become-vendor to customers only
    if (request.nextUrl.pathname.startsWith('/become-vendor')) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!profile || profile.role !== 'customer') {
          return NextResponse.redirect(new URL('/unauthorized', request.url))
        }
      } catch (error) {
        console.error('Middleware become-vendor role check error:', error)
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }
  }

  // Protected vendor routes
  if (request.nextUrl.pathname.startsWith('/vendor') &&
      !request.nextUrl.pathname.startsWith('/vendor-application')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching vendor profile:', error)
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      if (!profile || profile.role !== 'vendor') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    } catch (error) {
      console.error('Middleware profile fetch error:', error)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // Protected business routes
  const publicBusinessPaths = [
    '/business/login',
    '/business/signup',
    '/business/signup/success',
    '/business/forgot-password',
    '/business/reset-password'
  ]
  const isPublicBusinessPath = publicBusinessPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (request.nextUrl.pathname.startsWith('/business') && !isPublicBusinessPath) {
    if (!user) {
      return NextResponse.redirect(new URL('/business/login', request.url))
    }

    // Check if user is a business user
    try {
      const { data: businessUser, error } = await supabase
        .from('business_users')
        .select('id, is_active, business_accounts(status, subdomain, custom_domain)')
        .eq('auth_user_id', user.id)
        .single()

      if (error || !businessUser) {
        console.error('Not a business user:', error?.message)
        return NextResponse.redirect(new URL('/business/login', request.url))
      }

      // Check if business user is active
      if (!businessUser.is_active) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      // Check if business account is active
      if (businessUser.business_accounts?.status !== 'active') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      // Domain ownership validation is now handled in login API
      // No need for SMART REDIRECT - wrong business users cannot log in
    } catch (error) {
      console.error('Middleware business user fetch error:', error)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }


  // Redirect to admin dashboard if already logged in as admin
  if (request.nextUrl.pathname === '/admin/login' && user) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!error && profile && profile.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
    } catch (error) {
      console.error('Middleware profile fetch error:', error)
    }
  }

  // Redirect from login page if already logged in
  if (request.nextUrl.pathname === '/login' && user) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!error && profile) {
        switch (profile.role) {
          case 'customer':
            return NextResponse.redirect(new URL('/account', request.url))
          case 'vendor':
            return NextResponse.redirect(new URL('/vendor/dashboard', request.url))
          case 'admin':
            return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        }
      }
    } catch (error) {
      console.error('Middleware profile fetch error:', error)
    }
  }

  // Redirect business login if already logged in as business user
  if (request.nextUrl.pathname === '/business/login' && user) {
    try {
      const { data: businessUser, error } = await supabase
        .from('business_users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!error && businessUser) {
        return NextResponse.redirect(new URL('/business/dashboard', request.url))
      }
    } catch (error) {
      console.error('Middleware business user fetch error:', error)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}