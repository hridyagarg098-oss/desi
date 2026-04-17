import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          )
        },
      },
    }
  )

  // Refresh session — wrapped in timeout so Supabase DNS failure never blocks page loads
  let user = null
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
    ])
    if (result) {
      user = (result as Awaited<ReturnType<typeof supabase.auth.getUser>>).data?.user ?? null
    }
  } catch {
    // Supabase unreachable — treat as logged out and continue
  }

  const { pathname } = request.nextUrl

  // Only these routes strictly require auth
  // /explore and /chat are PUBLIC — login is only enforced at the API level for chat
  const isStrictlyProtected =
    pathname.startsWith('/profile') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/my-darlings') ||
    pathname.startsWith('/pricing')

  if (isStrictlyProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from auth pages to explore
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/explore'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
