'use server'

import { revalidatePath } from 'next/cache'
import { adminSupabase } from '@/lib/admin-supabase'

export async function uploadImage(url: string, context?: string) {
  const { error } = await adminSupabase
    .from('images')
    .insert([{ url, additional_context: context }])

  if (error) {
    console.error('Error uploading image:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin/content')
}

export async function updateImage(id: string, url: string, context?: string) {
  const { error } = await adminSupabase
    .from('images')
    .update({ url, additional_context: context })
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
