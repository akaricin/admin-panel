import { adminSupabase } from '@/lib/admin-supabase'
import SettingsClient from './SettingsClient'
import { Settings2, BrainCircuit, Database, Globe } from 'lucide-react'

export const revalidate = 0

export default async function SettingsPage() {
  // 1. Fetch all 'Flavors' (Themes in DB)
  const { data: flavors, error: flavorsError } = await adminSupabase
    .from('humor_themes')
    .select('*')
    .order('name')

  if (flavorsError) {
    console.error('Supabase fetch error (humor_themes):', flavorsError)
  }

  if (!flavors || flavors.length === 0) {
    console.log('Supabase returned empty array for humor_themes.')
  }

  // 2. Fetch existing mix weights
  const { data: mixWeights } = await adminSupabase
    .from('humor_flavor_mix')
    .select('*')

  // 3. Fetch models and providers for management
  const { data: models } = await adminSupabase
    .from('llm_models')
    .select('*, llm_providers(name)')
    .order('name')

  const { data: providers } = await adminSupabase
    .from('llm_providers')
    .select('*')
    .order('name')

  return (
    <div className="flex-1 bg-[#243119] min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-12 pb-20">
        <header className="space-y-2 border-b border-white/10 pb-8 flex justify-between items-end">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Settings2 className="h-8 w-8 text-white" />
              <h1 className="text-3xl text-white italic font-black uppercase tracking-widest">AI & Humor Settings</h1>
            </div>
            <p className="text-white/60">Configure humor personalities, AI model fleets, and system-wide generation weights.</p>
          </div>
        </header>

        {(!flavors || flavors.length === 0) ? (
          <div className="p-20 text-center border border-white/5 rounded-3xl bg-white/[0.02] text-white/20 italic font-black uppercase tracking-widest">
            No flavors found in the master registry.
          </div>
        ) : (
          <SettingsClient 
            flavors={flavors || []}
            initialMix={mixWeights || []}
            models={models || []}
            providers={providers || []}
          />
        )}
      </div>
    </div>
  )
}
