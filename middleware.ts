import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request,
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

  // Check if this is a custom domain (not the main platform domain)
  if (hostname !== platformDomain && !hostname.endsWith(`.${platformDomain}`) && !hostname.includes('localhost')) {
    try {
      // Query business by custom domain
      const { data: businessContext, error } = await supabase.rpc('get_business_by_custom_domain', {
        p_domain: hostname
      })

      if (!error && businessContext && businessContext.length > 0) {
        const business = businessContext[0]

        // Inject business branding context into response headers
        response.headers.set('x-business-id', business.id)
        response.headers.set('x-business-name', business.business_name || '')
        response.headers.set('x-brand-name', business.brand_name || business.business_name || '')
        response.headers.set('x-logo-url', business.logo_url || '')
        response.headers.set('x-primary-color', business.primary_color || '#3b82f6')
        response.headers.set('x-secondary-color', business.secondary_color || '#1e40af')
        response.headers.set('x-accent-color', business.accent_color || '#8b5cf6')
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

  // Protected customer routes
  if (request.nextUrl.pathname.startsWith('/customer')) {
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
        console.error('Error fetching customer profile:', error)
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      // Allow both customers and vendors to access customer routes
      // Vendors were once customers and may need to view their customer history
      if (!profile || (profile.role !== 'customer' && profile.role !== 'vendor')) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    } catch (error) {
      console.error('Middleware profile fetch error:', error)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // Protected vendor routes
  if (request.nextUrl.pathname.startsWith('/vendor')) {
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
  const publicBusinessPaths = ['/business/login', '/business/signup', '/business/signup/success']
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
        .select('id, is_active, business_accounts(status)')
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
            return NextResponse.redirect(new URL('/customer/dashboard', request.url))
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