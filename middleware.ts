import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adminSupabase } from './lib/admin-supabase'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect all routes starting with /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      // Rewrite to denied page instead of redirecting
      return NextResponse.rewrite(new URL('/denied', request.url))
    }

    // Query profiles table to check for superadmin status
    const { data: profile, error } = await adminSupabase
      .from('profiles')
      .select('is_superadmin')
      .eq('id', user.id)
      .single()

    if (error || !profile?.is_superadmin) {
      // Rewrite to denied page instead of redirecting
      return NextResponse.rewrite(new URL('/denied', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}
