'use client'

import { useState } from 'react'
import { Plus, Edit3, Trash2, Save, X, Loader2, ImageIcon, Search } from 'lucide-react'
import { createCaptionExample, updateCaptionExample, deleteCaptionExample } from './actions'

interface Example {
  id: number
  image_description: string
  caption: string
  explanation: string
  priority: number
  image_id?: string
  images?: { url: string }
}

interface Image {
  id: string
  url: string
}

interface Props {
  initialExamples: Example[]
  availableImages: Image[]
}

export default function ExamplesClient({ initialExamples, availableImages }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [editingExample, setEditingExample] = useState<Example | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [form, setForm] = useState({
    image_description: '',
    caption: '',
    explanation: '',
    priority: 0,
    image_id: ''
  })

  const openModal = (example?: Example) => {
    if (example) {
      setEditingExample(example)
      setForm({
        image_description: example.image_description,
        caption: example.caption,
        explanation: example.explanation,
        priority: example.priority,
        image_id: example.image_id || ''
      })
    } else {
      setEditingExample(null)
      setForm({
        image_description: '',
        caption: '',
        explanation: '',
        priority: 0,
        image_id: ''
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    try {
      if (editingExample) {
        await updateCaptionExample(editingExample.id, form)
      } else {
        await createCaptionExample(form)
      }
      setShowModal(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this example?')) return
    setIsProcessing(true)
    try {
      await deleteCaptionExample(id)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button
          onClick={() => openModal()}
          className="bg-white text-[#243119] px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/90 transition-all flex items-center gap-2 shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Add New Example
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialExamples.map((ex) => (
          <div key={ex.id} className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden flex flex-col group hover:bg-white/[0.08] transition-all duration-300">
            <div className="h-40 bg-black/40 relative overflow-hidden">
              {ex.images?.url ? (
                <img src={ex.images.url} alt="Example Ref" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/10">
                  <ImageIcon className="h-12 w-12" />
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-2">
                <button onClick={() => openModal(ex)} className="p-2 bg-black/50 backdrop-blur-md rounded-lg text-white/50 hover:text-white transition-colors">
                  <Edit3 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(ex.id)} className="p-2 bg-black/50 backdrop-blur-md rounded-lg text-white/50 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute bottom-3 left-3 px-2 py-0.5 bg-indigo-500/80 backdrop-blur-sm rounded text-[10px] font-black text-white uppercase tracking-tighter shadow-sm">
                Priority {ex.priority}
              </div>
            </div>
            
            <div className="p-6 space-y-4 flex-1 flex flex-col">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.2em]">Image Description</label>
                <p className="text-xs text-white/70 line-clamp-2 italic leading-relaxed">&quot;{ex.image_description}&quot;</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.2em]">Generated Caption</label>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-sm font-bold text-white leading-relaxed">{ex.caption}</p>
                </div>
              </div>

              <div className="space-y-1 flex-1">
                <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.2em]">Explanation</label>
                <p className="text-xs text-white/40 leading-relaxed">{ex.explanation}</p>
              </div>
            </div>
          </div>
        ))}
        {initialExamples.length === 0 && (
          <div className="col-span-full py-20 text-center border border-white/5 rounded-3xl bg-white/[0.02] text-white/20 italic">
            No few-shot examples found.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
          <div className="bg-[#243119] w-full max-w-2xl p-8 rounded-3xl border border-white/20 shadow-2xl relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
              <h3 className="text-2xl text-white italic">{editingExample ? 'Edit Example' : 'New Example'}</h3>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white transition-colors"><X className="h-6 w-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Linked Image</label>
                  <select
                    value={form.image_id}
                    onChange={(e) => setForm({ ...form, image_id: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 font-bold"
                  >
                    <option value="" className="bg-[#243119]">No Image</option>
                    {availableImages.map(img => (
                      <option key={img.id} value={img.id} className="bg-[#243119]">{img.url.split('/').pop()?.slice(0, 30)}...</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Priority</label>
                  <input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Image Description</label>
                <textarea
                  required
                  value={form.image_description}
                  onChange={(e) => setForm({ ...form, image_description: e.target.value })}
                  placeholder="Detailed visual description of the image content..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white min-h-[100px] text-sm leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Sample Caption</label>
                <input
                  required
                  type="text"
                  value={form.caption}
                  onChange={(e) => setForm({ ...form, caption: e.target.value })}
                  placeholder="The witty/funny caption to generate..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Explanation / Logic</label>
                <textarea
                  required
                  value={form.explanation}
                  onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                  placeholder="Why is this caption funny? What was the logic?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white min-h-[100px] text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-white text-[#243119] py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/90 transition-all flex items-center justify-center gap-2 shadow-xl"
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {editingExample ? 'Update Example' : 'Save Example'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
