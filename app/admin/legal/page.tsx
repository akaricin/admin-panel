import { adminSupabase } from '@/lib/admin-supabase'
import { Scale, BookOpen, Trash2, Edit3, ShieldAlert } from 'lucide-react'
import LegalClient from './LegalClient'

export const revalidate = 0

export default async function LegalManagementPage() {
  const { data: terms } = await adminSupabase
    .from('terms')
    .select('*')
    .order('priority', { ascending: false })

  return (
    <div className="flex-1 overflow-auto bg-[#243119] min-h-screen">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <header className="space-y-2 border-b border-white/10 pb-8">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-white" />
            <h1 className="text-3xl text-white">Terms & Definitions</h1>
          </div>
          <p className="text-white/60">Manage platform terms, definitions, and usage examples.</p>
        </header>

        <LegalClient initialTerms={terms || []} />
      </div>
    </div>
  )
}
