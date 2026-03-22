'use server'

import { revalidatePath } from 'next/cache'
import { adminSupabase } from '@/lib/admin-supabase'
import { getCurrentUserId } from '@/lib/supabase-server'

export async function updateTerm(id: number, data: { term: string, definition: string, example: string, priority: number }) {
  const userId = await getCurrentUserId()
  const { error } = await adminSupabase
    .from('terms')
    .update({
      term: data.term,
      definition: data.definition,
      example: data.example,
      priority: data.priority,
      modified_by_user_id: userId
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating term:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin/legal')
}

export async function deleteTerm(id: number) {
  const { error } = await adminSupabase
    .from('terms')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting term:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin/legal')
}
