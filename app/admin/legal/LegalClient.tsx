'use client'

import { useState } from 'react'
import { Edit3, Trash2, Save, X, Loader2, BookOpen, AlertCircle } from 'lucide-react'
import { updateTerm, deleteTerm } from './actions'

interface Term {
  id: number
  term: string
  definition: string
  example: string
  priority: number
}

interface Props {
  initialTerms: Term[]
}

export default function LegalClient({ initialTerms }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<Term>>({})
  const [isProcessing, setIsProcessing] = useState(false)

  const startEdit = (term: Term) => {
    setEditingId(term.id)
    setEditForm(term)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId || !editForm.term) return
    setIsProcessing(true)
    try {
      await updateTerm(editingId, {
        term: editForm.term!,
        definition: editForm.definition || '',
        example: editForm.example || '',
        priority: editForm.priority || 0
      })
      setEditingId(null)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this term permanently?')) return
    setIsProcessing(true)
    try {
      await deleteTerm(id)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider w-[20%]">Term</th>
              <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider w-[35%]">Definition</th>
              <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider w-[30%]">Example</th>
              <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider w-[5%] text-center">Priority</th>
              <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider w-[10%] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {initialTerms.map((t) => (
              <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                {editingId === t.id ? (
                  <td colSpan={5} className="p-0">
                    <form onSubmit={handleUpdate} className="p-6 bg-white/[0.03] space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Term</label>
                          <input
                            type="text"
                            value={editForm.term}
                            onChange={(e) => setEditForm({ ...editForm, term: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Priority</label>
                          <input
                            type="number"
                            value={editForm.priority}
                            onChange={(e) => setEditForm({ ...editForm, priority: parseInt(e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white font-bold"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Definition</label>
                        <textarea
                          value={editForm.definition}
                          onChange={(e) => setEditForm({ ...editForm, definition: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white h-24 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Example</label>
                        <textarea
                          value={editForm.example}
                          onChange={(e) => setEditForm({ ...editForm, example: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white h-20 text-sm italic"
                        />
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-4 py-2 rounded-xl text-white/50 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isProcessing}
                          className="bg-white text-[#243119] px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/90 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Update Term
                        </button>
                      </div>
                    </form>
                  </td>
                ) : (
                  <>
                    <td className="px-6 py-4 align-top">
                      <span className="text-sm font-bold text-white leading-relaxed">{t.term}</span>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <p className="text-xs text-white/60 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                        {t.definition || <span className="text-white/10 italic">No definition</span>}
                      </p>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <p className="text-xs text-white/40 italic leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
                        {t.example || <span className="text-white/10 italic">No example</span>}
                      </p>
                    </td>
                    <td className="px-6 py-4 align-top text-center">
                      <span className="text-[10px] font-mono text-white/40">{t.priority}</span>
                    </td>
                    <td className="px-6 py-4 align-top text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(t)}
                          className="p-2 text-white/20 hover:text-white transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-2 text-white/20 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {initialTerms.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-white/20 italic text-sm">
                  No terms found in the system.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
