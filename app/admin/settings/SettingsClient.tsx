'use client'

import { useState, useMemo } from 'react'
import { Plus, Save, Database, BrainCircuit, Globe, Edit2, Trash2, X, Loader2, Sparkles } from 'lucide-react'
import { 
  updateHumorMix, 
  createLLMModel, 
  updateLLMModel, 
  deleteLLMModel,
  createLLMProvider,
  updateLLMProvider,
  deleteLLMProvider
} from './actions'

interface Flavor {
  id: number
  name: string
  description?: string
}

interface MixWeight {
  humor_flavor_id: number
  caption_count: number
}

interface LLMModel {
  id: number
  name: string
  llm_provider_id: number
  provider_model_id: string
  is_temperature_supported: boolean
  llm_providers?: { name: string }
}

interface LLMProvider {
  id: number
  name: string
}

interface Props {
  flavors: Flavor[]
  initialMix: MixWeight[]
  models: LLMModel[]
  providers: LLMProvider[]
}

export default function SettingsClient({ flavors, initialMix, models, providers }: Props) {
  // 1. Slider Logic & Local State Object for Humor Mix
  const [mixState, setMixState] = useState<Record<number, number>>(() => {
    const initialState: Record<number, number> = {}
    // Initialize all flavors to 0 or their existing weight
    flavors.forEach(f => {
      const existing = initialMix.find(m => m.humor_flavor_id === f.id)
      initialState[f.id] = existing ? existing.caption_count : 0
    })
    return initialState
  })

  const [isUpdatingMix, setIsUpdatingMix] = useState(false)

  // Model/Provider modal states
  const [showModelModal, setShowModelModal] = useState(false)
  const [editingModel, setEditingModel] = useState<LLMModel | null>(null)
  const [modelForm, setModelForm] = useState({ name: '', llm_provider_id: providers[0]?.id || 0, provider_model_id: '', is_temperature_supported: true })
  const [isProcessingModel, setIsProcessingModel] = useState(false)

  const [showProviderModal, setShowProviderModal] = useState(false)
  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null)
  const [providerForm, setProviderForm] = useState({ name: '' })
  const [isProcessingProvider, setIsProcessingProvider] = useState(false)

  const totalWeight = useMemo(() => {
    return Object.values(mixState).reduce((a, b) => a + b, 0)
  }, [mixState])

  const handleWeightChange = (flavorId: number, value: number) => {
    setMixState(prev => ({ ...prev, [flavorId]: value }))
  }

  const handleSaveMix = async () => {
    setIsUpdatingMix(true)
    try {
      const mixData = Object.entries(mixState).map(([id, weight]) => ({
        humor_flavor_id: parseInt(id),
        weight: weight
      }))
      await updateHumorMix(mixData)
      alert('Mix weights updated successfully.')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsUpdatingMix(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-white">
      
      {/* LEFT COLUMN: Mix Sliders & Flavors List */}
      <div className="space-y-12">
        
        {/* MIX SLIDERS SECTION */}
        <section className="bg-white/5 rounded-3xl border border-white/10 p-8 shadow-xl space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-emerald-400" />
              <h2 className="text-xl text-white font-bold tracking-tight italic">Mix Sliders</h2>
            </div>
            <button
              onClick={handleSaveMix}
              disabled={isUpdatingMix}
              className="bg-emerald-500 text-[#243119] px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/10"
            >
              {isUpdatingMix ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Mix Weights
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {flavors.map((flavor) => (
              <div key={flavor.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4 hover:bg-white/[0.08] transition-all group">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-white/80 group-hover:text-emerald-400 transition-colors">
                    {flavor.name}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400/60 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                    {totalWeight > 0 ? Math.round((mixState[flavor.id] / totalWeight) * 100) : 0}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mixState[flavor.id] || 0}
                  onChange={(e) => handleWeightChange(flavor.id, parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[8px] font-black text-white/20 uppercase tracking-tighter">
                  <span>Subtle</span>
                  <span>Dominant</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FLAVORS LIST TABLE */}
        <section className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-xl flex flex-col">
          <div className="p-8 border-b border-white/10 flex items-center gap-3 bg-white/[0.02]">
            <BrainCircuit className="h-6 w-6 text-emerald-400" />
            <h2 className="text-xl text-white font-bold italic">Flavors Registry</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/5">
                  <th className="px-8 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Name</th>
                  <th className="px-8 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {flavors.map((f) => (
                  <tr key={f.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5 text-sm font-bold text-white/90">{f.name}</td>
                    <td className="px-8 py-5 text-xs text-white/40 leading-relaxed italic line-clamp-2 max-w-xs">{f.description || 'No description recorded.'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* RIGHT COLUMN: Fleet Management */}
      <div className="space-y-12">
        
        {/* PROVIDERS */}
        <section className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-xl">
          <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <Globe className="h-6 w-6 text-emerald-400" />
              <h2 className="text-xl text-white font-bold italic">AI Providers</h2>
            </div>
            <button onClick={() => setShowProviderModal(true)} className="p-2 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 text-emerald-400 transition-all border border-emerald-500/20">
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <tbody className="divide-y divide-white/5">
                {providers.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5 text-sm font-bold text-white/80">{p.name}</td>
                    <td className="px-8 py-5 text-right space-x-2">
                      <button className="p-2 text-white/20 hover:text-white transition-colors" title="Edit coming soon"><Edit2 className="h-4 w-4" /></button>
                      <button className="p-2 text-red-500/20 hover:text-red-500 transition-colors" title="Delete coming soon"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* MODELS */}
        <section className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-xl">
          <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-emerald-400" />
              <h2 className="text-xl text-white font-bold italic">Model Fleet</h2>
            </div>
            <button onClick={() => setShowModelModal(true)} className="p-2 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 text-emerald-400 transition-all border border-emerald-500/20">
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <tbody className="divide-y divide-white/5">
                {models.map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="text-sm font-bold text-white/80">{m.name}</div>
                      <div className="text-[10px] font-mono text-white/20 uppercase tracking-tighter">{m.provider_model_id}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white/10 rounded-md text-white/60">
                        {m.llm_providers?.name}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

    </div>
  )
}
