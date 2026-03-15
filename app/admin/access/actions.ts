'use server'

import { revalidatePath } from 'next/cache'
import { adminSupabase } from '@/lib/admin-supabase'

export async function addAllowedDomain(apex_domain: string) {
  const { error } = await adminSupabase
    .from('allowed_signup_domains')
    .insert([{ apex_domain }])

  if (error) {
    console.error('Error adding domain:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin/access')
}

export async function deleteAllowedDomain(id: number) {
  const { error } = await adminSupabase
    .from('allowed_signup_domains')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting domain:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin/access')
}

export async function addWhitelistedEmail(email_address: string) {
  const { error } = await adminSupabase
    .from('whitelist_email_addresses')
    .insert([{ email_address }])

  if (error) {
    console.error('Error adding email:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin/access')
}

export async function deleteWhitelistedEmail(id: number) {
  const { error } = await adminSupabase
    .from('whitelist_email_addresses')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting email:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin/access')
}
