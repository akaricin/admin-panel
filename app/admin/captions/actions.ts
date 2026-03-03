'use server'

import { revalidatePath } from 'next/cache'
import { adminSupabase } from '@/lib/admin-supabase'

export async function updateCaption(captionId: string, newContent: string) {
  const { error } = await adminSupabase
    .from('captions')
    .update({ content: newContent })
    .eq('id', captionId)

  if (error) {
    console.error('Error updating caption:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin/captions')
}
