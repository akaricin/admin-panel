'use server'

import { revalidatePath } from 'next/cache'
import { adminSupabase } from '@/lib/admin-supabase'

export async function toggleUserRole(userId: string, currentStatus: boolean) {
  const { error } = await adminSupabase
    .from('profiles')
    .update({ is_superadmin: !currentStatus })
    .eq('id', userId)

  if (error) {
    console.error('Error toggling user role:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin/users')
}
