'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

async function getSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
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
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

export async function signInWithGoogle() {
  const supabase = await getSupabaseClient()
  const headerList = await headers()
  const host = headerList.get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${protocol}://${host}/auth/callback`,
    },
  })

  if (error) {
    console.error('Error signing in with Google:', error.message)
    return redirect('/?error=Could not authenticate user')
  }

  if (data.url) {
    redirect(data.url)
  }
}

import { revalidatePath } from 'next/cache'
import { adminSupabase } from '@/lib/admin-supabase'

// ... (existing functions)

export async function signOut() {
  const supabase = await getSupabaseClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error signing out:', error.message)
  }

  redirect('/')
}

export async function toggleAdminStatus(userId: string, currentStatus: boolean) {
  const supabase = await getSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { error } = await adminSupabase
    .from('profiles')
    .update({ 
      is_superadmin: !currentStatus,
      modified_by_user_id: user?.id
    })
    .eq('id', userId)

  if (error) {
    console.error('Error toggling admin status:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin/users')
}
