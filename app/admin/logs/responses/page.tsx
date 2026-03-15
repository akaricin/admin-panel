import { adminSupabase } from '@/lib/admin-supabase'
import { Database, Cpu, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react'

export const revalidate = 0

export default async function ModelResponsesPage() {
  // 1. Separate Fetches - No Join logic used
  const [responsesRes, flavorsRes, modelsRes] = await Promise.all([
    adminSupabase
      .from('llm_model_responses')
      .select('*')
      .order('created_datetime_utc', { ascending: false })
      .limit(100),
    adminSupabase
      .from('humor_flavors')
      .select('*'),
    adminSupabase
      .from('llm_models')
      .select('id, name')
  ])

  // 2. Debug Info - Log exactly what is coming back
  console.log('--- DEBUG: Model Responses Data ---')
  console.log('Responses:', JSON.stringify(responsesRes.data?.slice(0, 2), null, 2))
  console.log('Flavors:', JSON.stringify(flavorsRes.data?.slice(0, 5), null, 2))
  console.log('Models:', JSON.stringify(modelsRes.data, null, 2))

  const responses = responsesRes.data || []
  const flavors = flavorsRes.data || []
  const models = modelsRes.data || []

  // Create lookup maps for efficiency
  const flavorMap = new Map(flavors.map(f => [String(f.id), f.name]))
  const modelMap = new Map(models.map(m => [String(m.id), m.name]))

  // Helper to determine status
  const getStatus = (item: any) => {
    const resp = item.llm_model_response || ''
    if (resp.startsWith('[PENDING]')) return 'Pending'
    if (resp.startsWith('[FAILED]') || (!resp && item.processing_time_seconds === 0 && new Date().getTime() - new Date(item.created_datetime_utc).getTime() > 60000)) return 'Failed'
    return 'Completed'
  }

  return (
    <div className="flex-1 overflow-auto bg-[#243119] min-h-screen pb-20 text-white">
      <div className="p-8 max-w-full mx-auto space-y-8">
        <header className="space-y-2 border-b border-white/10 pb-8 flex justify-between items-end">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-emerald-400" />
              <h1 className="text-3xl italic font-black uppercase tracking-widest">Model Responses</h1>
            </div>
            <p className="text-white/60 font-medium italic">Master audit log using manual frontend merging (Join-Free).</p>
          </div>
          {(responsesRes.error || flavorsRes.error) && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-xl border border-red-400/20 text-xs font-bold uppercase tracking-widest">
              <AlertCircle className="h-4 w-4" />
              Fetch Error Detected
            </div>
          )}
        </header>

        <div className="bg-slate-950 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-white/30 tracking-[0.2em] w-48">Timestamp</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-white/30 tracking-[0.2em] w-64">Model & Flavor</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-white/30 tracking-[0.2em] w-32 text-center">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-white/30 tracking-[0.2em]">Raw AI Output</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-white/30 tracking-[0.2em] text-center w-24">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {responses.map((r: any) => {
                  const status = getStatus(r)
                  
                  // 3. Manual Merge: Try matching ID from human_flavor_id or humor_flavor_id
                  const fid = r.human_flavor_id || r.humor_flavor_id
                  const flavorName = fid ? (flavorMap.get(String(fid)) || `ID: ${fid}`) : 'Standard'
                  
                  const modelName = modelMap.get(String(r.llm_model_id)) || `M_ID: ${r.llm_model_id}`
                  
                  return (
                    <tr key={r.id} className="hover:bg-emerald-500/5 transition-colors group">
                      <td className="px-6 py-6 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-white/60">{new Date(r.created_datetime_utc).toLocaleDateString()}</span>
                          <span className="text-[10px] text-white/20 font-mono">{new Date(r.created_datetime_utc).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6 align-top">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Cpu className="h-3 w-3 text-emerald-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/80 truncate">
                              {modelName}
                            </span>
                          </div>
                          <div className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 inline-block">
                            <span className="text-[9px] font-black text-emerald-400 uppercase italic tracking-widest">
                              {flavorName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 align-top text-center">
                        {status === 'Completed' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            OK
                          </span>
                        ) : status === 'Pending' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-amber-400 ring-1 ring-inset ring-amber-500/20">
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            BUSY
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-red-400 ring-1 ring-inset ring-red-500/20">
                            <AlertCircle className="h-2.5 w-2.5" />
                            FAIL
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-6 align-top">
                        {/* CLEAN SCROLLABLE CODE BLOCK */}
                        <div className="max-h-40 overflow-y-auto custom-scrollbar bg-black/60 rounded-xl border border-white/5 p-4 group-hover:border-emerald-500/20 transition-all shadow-inner">
                          <code className="text-[11px] font-mono text-white/40 whitespace-pre-wrap leading-relaxed">
                            {r.llm_model_response || 'No payload recorded.'}
                          </code>
                        </div>
                      </td>
                      <td className="px-6 py-6 align-top text-center">
                        <span className="text-[10px] font-mono font-bold text-white/30">{r.processing_time_seconds}s</span>
                      </td>
                    </tr>
                  )
                })}
                {responses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-white/20 italic font-black uppercase tracking-widest">
                      Zero inference responses found in current logs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
