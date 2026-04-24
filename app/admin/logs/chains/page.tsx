import { adminSupabase } from '@/lib/admin-supabase'
import { Terminal, Activity, ImageIcon, Clock, AlertTriangle } from 'lucide-react'

export const revalidate = 0

export default async function PromptChainsPage() {
  // 1. Separate Fetches - No Join logic to avoid "Database fetch error"
  const [chainsRes, requestsRes, imagesRes, responsesRes] = await Promise.all([
    adminSupabase
      .from('llm_prompt_chains')
      .select('*')
      .order('created_datetime_utc', { ascending: false })
      .limit(50),
    adminSupabase
      .from('caption_requests')
      .select('id, image_id'),
    adminSupabase
      .from('images')
      .select('id, url'),
    adminSupabase
      .from('llm_model_responses')
      .select('id, llm_prompt_chain_id, llm_system_prompt, humor_flavor_id')
  ])

  // 2. Terminal logging for debugging removed

  // 3. Error Handling
  if (chainsRes.error) {
    return (
      <div className="flex-1 bg-[#243119] min-h-screen p-8 flex flex-col items-center justify-center text-red-400">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-black uppercase tracking-widest">Database Fetch Error</h2>
        <p className="text-white/60 font-mono text-sm mt-2">{chainsRes.error.message}</p>
      </div>
    )
  }

  const chains = chainsRes.data || []
  const requests = requestsRes.data || []
  const images = imagesRes.data || []
  const responses = responsesRes.data || []

  // Create lookup maps for fast manual merging
  const requestMap = new Map(requests.map(r => [String(r.id), r.image_id]))
  const imageMap = new Map(images.map(i => [String(i.id), i.url]))
  
  // Group responses by chain_id
  const responseByChain = responses.reduce((acc: any, r: any) => {
    if (!r.llm_prompt_chain_id) return acc
    if (!acc[r.llm_prompt_chain_id]) acc[r.llm_prompt_chain_id] = []
    acc[r.llm_prompt_chain_id].push(r)
    return acc
  }, {})

  return (
    <div className="flex-1 overflow-auto bg-[#243119] min-h-screen pb-20">
      <div className="p-8 max-full mx-auto space-y-8">
        <header className="space-y-2 border-b border-white/10 pb-8">
          <div className="flex items-center gap-3">
            <Terminal className="h-8 w-8 text-emerald-400" />
            <h1 className="text-3xl text-white italic font-black uppercase tracking-widest">Prompt Chains</h1>
          </div>
          <p className="text-white/60 font-medium italic text-sm">Diagnostic breakdown of multi-step sequence logic (Frontend Merge Version).</p>
        </header>

        {/* MODERN GREEN UI TABLE */}
        <div className="bg-slate-950 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-white/30 tracking-[0.2em] w-24">ID</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-white/30 tracking-[0.2em] w-64">Chain Metadata</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-white/30 tracking-[0.2em] w-48">Ref Image</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-white/30 tracking-[0.2em]">Template Logic / System Prompt</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-white/30 tracking-[0.2em] w-48">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {chains.map((item: any) => {
                  const chainResponses = responseByChain[item.id] || []
                  const firstResponse = chainResponses[0] || {}
                  
                  // Flexible mapping for missing columns
                  const name = item.name || `Chain Seq #${item.id}`
                  const description = item.description || `${chainResponses.length} sequence steps detected`
                  const template = item.template || item.chain_logic || firstResponse.llm_system_prompt || 'N/A'

                  // Link Image
                  const imageId = requestMap.get(String(item.caption_request_id))
                  const imageUrl = imageId ? imageMap.get(String(imageId)) : null

                  return (
                    <tr key={item.id} className="hover:bg-emerald-500/5 transition-colors group">
                      <td className="px-6 py-6 align-top">
                        <span className="font-mono text-xs text-emerald-400 font-bold">#{item.id}</span>
                      </td>
                      <td className="px-6 py-6 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-white uppercase tracking-tight italic group-hover:text-emerald-400 transition-colors">
                            {name}
                          </span>
                          <span className="text-[10px] text-white/30 leading-relaxed font-bold uppercase tracking-widest">
                            {description}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6 align-top">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-black/40 overflow-hidden border border-white/10 shadow-inner group-hover:border-emerald-500/30 transition-colors">
                            {imageUrl ? (
                              <img src={imageUrl} alt="Ref" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-white/5">
                                <ImageIcon className="h-4 w-4 text-white/10" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono text-white/20 uppercase">REQ_{item.caption_request_id}</span>
                            <span className="text-[8px] font-mono text-white/10 truncate max-w-[80px]">{imageId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 align-top">
                        <div className="max-w-xl bg-black/40 rounded-xl border border-white/5 p-4 group-hover:border-emerald-500/20 transition-all">
                          <p className="text-[11px] font-mono text-white/40 italic leading-relaxed whitespace-pre-wrap line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                            {template}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-6 align-top">
                        <div className="flex items-center gap-2 text-white/40">
                          <Clock className="h-3 w-3" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white/60">{new Date(item.created_datetime_utc).toLocaleDateString()}</span>
                            <span className="text-[9px] uppercase tracking-widest">{new Date(item.created_datetime_utc).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {chains.length === 0 && (
          <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02] text-white/20 italic font-black uppercase tracking-widest">
            No chains recorded in registry.
          </div>
        )}
      </div>
    </div>
  )
}
