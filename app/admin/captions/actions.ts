'use server'

import { revalidatePath } from 'next/cache'
import { adminSupabase } from '@/lib/admin-supabase'

export async function uploadImage(url: string, altText?: string) {
  const { error } = await adminSupabase
    .from('images')
    .insert([{ url, alt_text: altText }])

  if (error) {
    console.error('Error uploading image:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin/captions')
}

export async function updateImage(id: string, url: string, altText?: string) {
  const { error } = await adminSupabase
    .from('images')
    .update({ url, alt_text: altText })
    .eq('id', id)

  if (error) {
    console.error('Error updating image:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin/captions')
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

  revalidatePath('/admin/captions')
}
