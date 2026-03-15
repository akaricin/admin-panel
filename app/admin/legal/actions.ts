'use server'

import { revalidatePath } from 'next/cache'
import { adminSupabase } from '@/lib/admin-supabase'

export async function updateTerm(id: number, data: { term: string, definition: string, example: string, priority: number }) {
  const { error } = await adminSupabase
    .from('terms')
    .update({
      term: data.term,
      definition: data.definition,
      example: data.example,
      priority: data.priority,
      modified_datetime_utc: new Date().toISOString()
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
