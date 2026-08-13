import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { detectCurrencyFromAcceptLanguage, isValidCurrencyCode } from '@/lib/currency/detect'
import { CURRENCY_COOKIE_NAME, CURRENCY_COOKIE_MAX_AGE } from '@/lib/currency/types'

/**
 * Routes whose Server Actions authenticate themselves, so middleware does not have to.
 *
 * Next dispatches a Server Action as a POST carrying `next-action`, and the client waits
 * on a `text/x-component` flight stream. Answer one with a redirect or an HTML rewrite
 * and the awaited promise never settles: the caller's button spins forever, because the
 * flight reader neither resolves nor rejects. That is the stuck submit button on the
 * vendor application form, reproduced by clearing the session cookie and submitting.
 *
 * Letting these POSTs past the middleware gate costs nothing, because each action calls
 * supabase.auth.getUser() itself and returns { error: "Unauthorized" }, which the form
 * renders as a toast. app/become-vendor/actions.ts binds its insert to user.id, and
 * app/vendor-application/actions.ts additionally checks row ownership and pending status
 * in both JS and SQL.
 *
 * Exact paths, never a prefix: a future `/vendor-application/<something>` segment must
 * have to opt in here deliberately rather than inherit the exemption. Every other route,
 * /admin and /vendor and /business and /account included, keeps its middleware gate,
 * because Server Action ids resolve per page bundle and several of those actions have no
 * auth check of their own.
 */
const SELF_AUTHENTICATING_ACTION_PATHS = [
  '/become-vendor',
  '/vendor-application',
  '/vendor-application/edit',
]

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  // Header lookup is case insensitive, so this matches the `Next-Action` sent on the wire.
  const isSelfAuthenticatingActionPost =
    request.method === 'POST' &&
    request.headers.get('next-action') !== null &&
    SELF_AUTHENTICATING_ACTION_PATHS.includes(request.nextUrl.pathname)

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  /**
   * Copies whatever cookies are currently staged on `supabaseResponse` onto `res`.
   *
   * getUser() below rotates the refresh token and stages the replacement `sb-*` cookies
   * through the setAll callback above. Returning a bare NextResponse.redirect drops those
   * Set-Cookie headers, and Supabase has already spent the old refresh token server side,
   * so the browser is left holding a dead one and the user is signed out at random. Every
   * exit from here therefore goes through redirectWith/rewriteWith.
   *
   * Reads the `supabaseResponse` binding rather than taking it as an argument: setAll
   * reassigns that variable, so a captured copy would go stale. Do not introduce a
   * `const` snapshot of it above a branch.
   */
  function withStagedCookies(res: NextResponse): NextResponse {
    for (const cookie of supabaseResponse.cookies.getAll()) {
      res.cookies.set(cookie)
    }
    return res
  }

  /** NextResponse.redirect that preserves refreshed Supabase auth cookies. */
  function redirectWith(url: URL | string): NextResponse {
    return withStagedCookies(NextResponse.redirect(url))
  }

  /** NextResponse.rewrite that preserves refreshed Supabase auth cookies. */
  function rewriteWith(url: URL | string): NextResponse {
    return withStagedCookies(NextResponse.rewrite(url))
  }

  // Refresh session if expired
  let user = null
  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser()
    if (error && error.message !== 'Auth session missing!') {
      console.warn('Middleware auth error:', error.message)
    }
    user = authUser
  } catch (error) {
    console.error('Middleware fetch error:', error)
  }

  // Currency preference handling (after auth so supabaseResponse has refreshed cookies)
  const currencyCookie = request.cookies.get(CURRENCY_COOKIE_NAME)
  if (!currencyCookie?.value) {
    const acceptLanguage = request.headers.get('accept-language')
    const detectedCurrency = detectCurrencyFromAcceptLanguage(acceptLanguage)
    supabaseResponse.cookies.set(CURRENCY_COOKIE_NAME, detectedCurrency, {
      maxAge: CURRENCY_COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
    })
  } else if (!isValidCurrencyCode(currencyCookie.value)) {
    const acceptLanguage = request.headers.get('accept-language')
    const detectedCurrency = detectCurrencyFromAcceptLanguage(acceptLanguage)
    supabaseResponse.cookies.set(CURRENCY_COOKIE_NAME, detectedCurrency, {
      maxAge: CURRENCY_COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
    })
  }

  // Domain-based business identification for white-labeling
  const hostname = request.headers.get('host') || request.nextUrl.hostname
  const platformDomain = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001').hostname

  // Maintenance mode gate (main platform domain only).
  // Anonymous visitors see the maintenance page; any logged-in user browses normally.
  // Business subdomains/custom domains are exempt (non-platform hosts skip this block).
  const isMainPlatformHost =
    hostname === platformDomain || hostname.startsWith(`${platformDomain}:`)

  const MAINTENANCE_EXEMPT_PREFIXES = [
    '/admin',        // admin panel + login (so admin can toggle it off)
    '/business',     // business portals exempt
    '/api',          // API + auth routes
    '/_next',        // Next internals / data
    '/maintenance',  // the maintenance page itself (avoid loop)
    '/login',           // customer/vendor login (let anonymous authenticate)
    '/register',        // customer signup (let anonymous register)
    '/verify-email',    // email verification link (works during maintenance)
    '/forgot-password', // password reset request (works during maintenance)
    '/reset-password',  // password reset form (works during maintenance)
    '/auth',            // auth callbacks (email confirm, etc.)
    '/unauthorized',
    '/robots.txt',   // crawl directives must stay reachable during maintenance
    '/sitemap.xml',  // sitemap must stay reachable during maintenance
  ]

  // Only anonymous traffic needs these flags: maintenance gates anonymous visitors,
  // and crawlers (the target of the indexing block) are always anonymous. Skipping
  // the uncached read for logged-in users keeps it off the authenticated hot path.
  if (isMainPlatformHost && !user) {
    const { readSiteFlags } = await import('@/lib/site-settings/flags')
    const flags = await readSiteFlags(supabase)

    // Maintenance gate: anonymous visitors on non-exempt paths see the maintenance page.
    if (
      flags.maintenanceMode &&
      // Rewriting a Server Action POST to an HTML page hangs the caller (see
      // SELF_AUTHENTICATING_ACTION_PATHS). Maintenance is a presentation gate, not an
      // authorization one, so skipping it here grants nothing that is not already
      // reachable when maintenance is off.
      !isSelfAuthenticatingActionPost &&
      !MAINTENANCE_EXEMPT_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p))
    ) {
      return rewriteWith(new URL('/maintenance', request.url))
    }

    // Pre-launch crawl block: keep search engines out of demo content.
    if (flags.blockIndexing) {
      supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    }
  }

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
        supabaseResponse.headers.set('x-business-id', business.id)
        supabaseResponse.headers.set('x-business-name', business.business_name || '')
        supabaseResponse.headers.set('x-brand-name', business.brand_name || business.business_name || '')
        supabaseResponse.headers.set('x-logo-url', business.logo_url || '')

        // Extract colors from theme_config JSONB (new consolidated structure)
        // Falls back to defaults if theme_config is not set
        const themeConfig = business.theme_config as {
          accent?: { primary?: string; secondary?: string; tertiary?: string };
        } | null
        const primaryColor = themeConfig?.accent?.primary || '#C6AA88'
        const secondaryColor = themeConfig?.accent?.secondary || '#14B8A6'
        const accentColor = themeConfig?.accent?.tertiary || '#06B6D4'

        supabaseResponse.headers.set('x-primary-color', primaryColor)
        supabaseResponse.headers.set('x-secondary-color', secondaryColor)
        supabaseResponse.headers.set('x-accent-color', accentColor)
        supabaseResponse.headers.set('x-custom-domain', 'true')

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
        return redirectWith(new URL('/business-not-found', request.url))
      }
    }

    // Root path - redirect to appropriate business entry point
    if (pathname === '/') {
      const redirectPath = getBusinessRedirectPath(!!user)
      return redirectWith(new URL(redirectPath, request.url))
    }

    // Block signup routes on custom domains and subdomains
    // Signup should only be allowed on main platform domain
    // Business users must register on the main website first
    if (pathname.startsWith('/business/signup')) {
      console.log('Signup blocked on custom domain/subdomain, redirecting to login')
      return redirectWith(new URL('/business/login', request.url))
    }

    // Check if current path is allowed on custom domains
    if (!isAllowedOnCustomDomain(pathname)) {
      // Redirect disallowed routes to business portal
      const redirectPath = getBusinessRedirectPath(!!user)
      return redirectWith(new URL(redirectPath, request.url))
    }

    // Path is allowed, continue to business portal routes
    // (will be handled by business authentication middleware below)
  }

  // Protected admin routes
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')) {
    if (!user) {
      return redirectWith(new URL('/admin/login', request.url))
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
        return redirectWith(new URL('/unauthorized', request.url))
      }

      if (!profile || profile.role !== 'admin') {
        return redirectWith(new URL('/unauthorized', request.url))
      }
    } catch (error) {
      console.error('Middleware profile fetch error:', error)
      return redirectWith(new URL('/unauthorized', request.url))
    }
  }

  // Protected account routes (replaced customer routes)
  if (request.nextUrl.pathname.startsWith('/account') ||
      request.nextUrl.pathname.startsWith('/become-vendor') ||
      request.nextUrl.pathname.startsWith('/vendor-application')) {
    // A 307 on a Server Action POST is re-sent to /login, where the action id does not
    // resolve, and the caller is left waiting on a response that never comes. The actions
    // on these paths reject unauthenticated callers themselves, so the form gets a real
    // error to show instead.
    if (!user && !isSelfAuthenticatingActionPost) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return redirectWith(redirectUrl)
    }

    // Restrict /become-vendor to customers only.
    // Guarded on `user` because the branch above no longer guarantees one: an
    // unauthenticated action POST reaches here, and user.id would throw.
    if (user && request.nextUrl.pathname.startsWith('/become-vendor')) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!profile || profile.role !== 'customer') {
          return redirectWith(new URL('/unauthorized', request.url))
        }
      } catch (error) {
        console.error('Middleware become-vendor role check error:', error)
        return redirectWith(new URL('/unauthorized', request.url))
      }
    }
  }

  // Protected vendor routes
  if (request.nextUrl.pathname.startsWith('/vendor') &&
      !request.nextUrl.pathname.startsWith('/vendor-application')) {
    if (!user) {
      return redirectWith(new URL('/login', request.url))
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching vendor profile:', error)
        return redirectWith(new URL('/unauthorized', request.url))
      }

      if (!profile || profile.role !== 'vendor') {
        return redirectWith(new URL('/unauthorized', request.url))
      }
    } catch (error) {
      console.error('Middleware profile fetch error:', error)
      return redirectWith(new URL('/unauthorized', request.url))
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
      return redirectWith(new URL('/business/login', request.url))
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
        return redirectWith(new URL('/business/login', request.url))
      }

      // Check if business user is active
      if (!businessUser.is_active) {
        return redirectWith(new URL('/unauthorized', request.url))
      }

      // Check if business account is active
      const businessAccount = Array.isArray(businessUser.business_accounts)
        ? businessUser.business_accounts[0]
        : businessUser.business_accounts

      if (businessAccount?.status !== 'active') {
        return redirectWith(new URL('/unauthorized', request.url))
      }

      // Domain ownership validation is now handled in login API
      // No need for SMART REDIRECT - wrong business users cannot log in
    } catch (error) {
      console.error('Middleware business user fetch error:', error)
      return redirectWith(new URL('/unauthorized', request.url))
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
        return redirectWith(new URL('/admin/dashboard', request.url))
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
            return redirectWith(new URL('/account', request.url))
          case 'vendor':
            return redirectWith(new URL('/vendor/dashboard', request.url))
          case 'admin':
            return redirectWith(new URL('/admin/dashboard', request.url))
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
        return redirectWith(new URL('/business/dashboard', request.url))
      }
    } catch (error) {
      console.error('Middleware business user fetch error:', error)
    }
  }

  return supabaseResponse
}

export const proxyConfig = {
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
