'use client'

import { useState } from 'react'
import { Globe, Mail, Plus, Trash2, Loader2 } from 'lucide-react'
import { addAllowedDomain, deleteAllowedDomain, addWhitelistedEmail, deleteWhitelistedEmail } from './actions'

interface Domain {
  id: number
  apex_domain: string
  created_datetime_utc: string
}

interface Email {
  id: number
  email_address: string
  created_datetime_utc: string
}

interface Props {
  initialDomains: Domain[]
  initialEmails: Email[]
}

export default function AccessClient({ initialDomains, initialEmails }: Props) {
  const [domainInput, setDomainInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [isAddingDomain, setIsAddingDomain] = useState(false)
  const [isAddingEmail, setIsAddingEmail] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!domainInput) return
    setIsAddingDomain(true)
    try {
      await addAllowedDomain(domainInput)
      setDomainInput('')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsAddingDomain(false)
    }
  }

  const handleDeleteDomain = async (id: number) => {
    if (!confirm('Remove this domain?')) return
    setProcessingId(id)
    try {
      await deleteAllowedDomain(id)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput) return
    setIsAddingEmail(true)
    try {
      await addWhitelistedEmail(emailInput)
      setEmailInput('')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsAddingEmail(false)
    }
  }

  const handleDeleteEmail = async (id: number) => {
    if (!confirm('Remove this email?')) return
    setProcessingId(id)
    try {
      await deleteWhitelistedEmail(id)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Domains Card */}
      <section className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-xl flex flex-col">
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-indigo-400" />
            <h2 className="text-xl text-white/80">Allowed Domains</h2>
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          <form onSubmit={handleAddDomain} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. columbia.edu"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold placeholder:text-white/20"
            />
            <button
              type="submit"
              disabled={isAddingDomain}
              className="bg-indigo-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-400 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isAddingDomain ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </form>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {initialDomains.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/[0.08] transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white/90">{d.apex_domain}</span>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">Added {new Date(d.created_datetime_utc).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={() => handleDeleteDomain(d.id)}
                  disabled={processingId === d.id}
                  className="p-2 text-white/20 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  {processingId === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            ))}
            {initialDomains.length === 0 && (
              <p className="text-center py-8 text-white/20 italic text-sm">No domains configured.</p>
            )}
          </div>
        </div>
      </section>

      {/* Emails Card */}
      <section className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-xl flex flex-col">
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-emerald-400" />
            <h2 className="text-xl text-white/80">Whitelisted Emails</h2>
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          <form onSubmit={handleAddEmail} className="flex gap-2">
            <input
              type="email"
              placeholder="e.g. admin@columbia.edu"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold placeholder:text-white/20"
            />
            <button
              type="submit"
              disabled={isAddingEmail}
              className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isAddingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </form>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {initialEmails.map((e) => (
              <div key={e.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/[0.08] transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white/90">{e.email_address}</span>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">Added {new Date(e.created_datetime_utc).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={() => handleDeleteEmail(e.id)}
                  disabled={processingId === e.id}
                  className="p-2 text-white/20 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  {processingId === e.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            ))}
            {initialEmails.length === 0 && (
              <p className="text-center py-8 text-white/20 italic text-sm">No individual emails whitelisted.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
