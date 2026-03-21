'use server'

import { revalidatePath } from 'next/cache'
import { adminSupabase } from '@/lib/admin-supabase'
import { getCurrentUserId } from '@/lib/supabase'

// --- HUMOR MIX ACTIONS ---

/**
 * Updates or inserts humor mix weights.
 * Using upsert to ensure even new flavors can have weights set.
 */
export async function updateHumorMix(mixData: { humor_flavor_id: number, weight: number }[]) {
  const userId = await getCurrentUserId()
  for (const item of mixData) {
    // We check if a record exists for this flavor in the mix
    const { data: existing } = await adminSupabase
      .from('humor_flavor_mix')
      .select('id')
      .eq('humor_flavor_id', item.humor_flavor_id)
      .single()

    if (existing) {
      const { error } = await adminSupabase
        .from('humor_flavor_mix')
        .update({ 
          caption_count: item.weight,
          modified_by_user_id: userId
        })
        .eq('humor_flavor_id', item.humor_flavor_id)
      
      if (error) throw new Error(`Update failed: ${error.message}`)
    } else {
      const { error } = await adminSupabase
        .from('humor_flavor_mix')
        .insert([{ 
          humor_flavor_id: item.humor_flavor_id, 
          caption_count: item.weight,
          created_by_user_id: userId,
          modified_by_user_id: userId
        }])
      
      if (error) throw new Error(`Insert failed: ${error.message}`)
    }
  }
  revalidatePath('/admin/settings')
}

// --- PROVIDER ACTIONS ---

export async function createLLMProvider(name: string) {
  const userId = await getCurrentUserId()
  const { error } = await adminSupabase
    .from('llm_providers')
    .insert([{ 
      name,
      created_by_user_id: userId,
      modified_by_user_id: userId
    }])

  if (error) throw new Error(error.message)
  revalidatePath('/admin/settings')
}

export async function updateLLMProvider(id: number, name: string) {
  const userId = await getCurrentUserId()
  const { error } = await adminSupabase
    .from('llm_providers')
    .update({ 
      name,
      modified_by_user_id: userId
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/settings')
}

export async function deleteLLMProvider(id: number) {
  const { error } = await adminSupabase
    .from('llm_providers')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/settings')
}

// --- MODEL ACTIONS ---

export async function createLLMModel(data: { 
  name: string, 
  llm_provider_id: number, 
  provider_model_id: string, 
  is_temperature_supported: boolean 
}) {
  const userId = await getCurrentUserId()
  const { error } = await adminSupabase
    .from('llm_models')
    .insert([{
      ...data,
      created_by_user_id: userId,
      modified_by_user_id: userId
    }])

  if (error) throw new Error(error.message)
  revalidatePath('/admin/settings')
}

export async function updateLLMModel(id: number, data: { 
  name: string, 
  llm_provider_id: number, 
  provider_model_id: string, 
  is_temperature_supported: boolean 
}) {
  const userId = await getCurrentUserId()
  const { error } = await adminSupabase
    .from('llm_models')
    .update({
      ...data,
      modified_by_user_id: userId
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/settings')
}

export async function deleteLLMModel(id: number) {
  const { error } = await adminSupabase
    .from('llm_models')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/settings')
}
