'use server'

import { revalidatePath } from 'next/cache'
import { adminSupabase } from '@/lib/admin-supabase'

export async function createCaptionExample(data: { 
  image_description: string, 
  caption: string, 
  explanation: string, 
  priority: number,
  image_id?: string
}) {
  const { error } = await adminSupabase
    .from('caption_examples')
    .insert([data])

  if (error) {
    console.error('Error creating example:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin/examples')
}

export async function updateCaptionExample(id: number, data: { 
  image_description: string, 
  caption: string, 
  explanation: string, 
  priority: number,
  image_id?: string
}) {
  const { error } = await adminSupabase
    .from('caption_examples')
    .update({
      ...data,
      modified_datetime_utc: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating example:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin/examples')
}

export async function deleteCaptionExample(id: number) {
  const { error } = await adminSupabase
    .from('caption_examples')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting example:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin/examples')
}
