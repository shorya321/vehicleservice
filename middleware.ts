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