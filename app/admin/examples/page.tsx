import { adminSupabase } from '@/lib/admin-supabase'
import { Lightbulb, Image as ImageIcon, Trash2, Edit3, Plus } from 'lucide-react'
import ExamplesClient from './ExamplesClient'

export const revalidate = 0

export default async function ExamplesManagementPage() {
  const { data: examples } = await adminSupabase
    .from('caption_examples')
    .select('*, images(url)')
    .order('priority', { ascending: false })

  const { data: images } = await adminSupabase
    .from('images')
    .select('id, url')
    .limit(100)

  return (
    <div className="flex-1 overflow-auto bg-[#243119] min-h-screen">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <header className="space-y-2 border-b border-white/10 pb-8 flex justify-between items-end">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Lightbulb className="h-8 w-8 text-white" />
              <h1 className="text-3xl text-white">Caption Examples</h1>
            </div>
            <p className="text-white/60">Manage few-shot examples used to guide AI caption generation.</p>
          </div>
        </header>

        <ExamplesClient 
          initialExamples={examples || []} 
          availableImages={images || []}
        />
      </div>
    </div>
  )
}
