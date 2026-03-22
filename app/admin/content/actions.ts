'use server'

import { revalidatePath } from 'next/cache'
import { adminSupabase } from '@/lib/admin-supabase'
import { getCurrentUserId } from '@/lib/supabase-server'

export async function uploadImage(url: string, context: string) {
  const userId = await getCurrentUserId()
  const { error } = await adminSupabase
    .from('images')
    .insert([{ 
      url, 
      additional_context: context,
      created_by_user_id: userId,
      modified_by_user_id: userId
    }])

  if (error) {
    console.error('Error uploading image:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin/content')
}

export async function updateImage(id: string, url: string, context: string) {
  const userId = await getCurrentUserId()
  const { error } = await adminSupabase
    .from('images')
    .update({ 
      url, 
      additional_context: context,
      modified_by_user_id: userId
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating image:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin/content')
}


export async function deleteImage(id: string) {
  const { error } = await adminSupabase
    .from('images')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting image:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin/content')
}
