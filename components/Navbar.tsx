import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { signInWithGoogle, signOut } from '@/app/auth/actions'
import { adminSupabase } from '@/lib/admin-supabase'

export default async function Navbar() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore error from RSC
          }
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isSuperAdmin = false
  if (user) {
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('is_superadmin')
      .eq('id', user.id)
      .single()
    
    isSuperAdmin = !!profile?.is_superadmin
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#243119]/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-white">
            Project 2
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {!user ? (
            <form action={signInWithGoogle}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/20 transition-colors shadow-sm"
              >
                <img 
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  alt="Google" 
                  className="h-4 w-4"
                />
                Sign in with Google
              </button>
            </form>
          ) : (
            <>
              {isSuperAdmin && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                >
                  Admin Panel
                </Link>
              )}
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-md bg-white px-4 py-1.5 text-sm font-medium text-[#243119] hover:bg-white/90 transition-colors shadow-sm"
                >
                  Sign Out
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
