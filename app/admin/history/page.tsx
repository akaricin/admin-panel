import { adminSupabase } from '@/lib/admin-supabase'
import { Activity, Clock, Cpu, ImageIcon, MoreHorizontal, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import ReRunAction from '@/components/HistoryTableActions'

export const revalidate = 0 // Disable cache for history page

export default async function GenerationHistoryPage() {
  // Enhanced fetch with joins:
  // llm_model_responses -> caption_requests -> images (url)
  // llm_model_responses -> llm_models (name)
  const { data: history, error } = await adminSupabase
    .from('llm_model_responses')
    .select(`
      id,
      created_datetime_utc,
      llm_model_response,
      llm_model_id,
      processing_time_seconds,
      llm_models (name),
      caption_requests (
        image_id,
        images (
          url
        )
      )
    `)
    .order('created_datetime_utc', { ascending: false })

  if (error) {
    return (
      <div className="p-8 text-red-400 font-medium bg-[#243119]">
        Error loading history: {error.message}
      </div>
    )
  }

  // Helper to parse potential JSON content in the response
  const parseResponse = (response: any) => {
    try {
      if (typeof response === 'string') {
        if (response.startsWith('[PENDING]')) return response.replace('[PENDING]', '').trim()
        if (response.startsWith('[FAILED]')) return response.replace('[FAILED]', '').trim()
        
        const parsed = JSON.parse(response)
        if (Array.isArray(parsed)) return parsed.join(' | ')
        if (typeof parsed === 'object') return JSON.stringify(parsed)
        return parsed
      }
      return response
    } catch (e) {
      return response
    }
  }

  // Helper to determine status
  const getStatus = (item: any) => {
    const resp = item.llm_model_response || ''
    if (resp.startsWith('[PENDING]')) return 'Pending'
    if (resp.startsWith('[FAILED]') || (!resp && item.processing_time_seconds === 0 && new Date().getTime() - new Date(item.created_datetime_utc).getTime() > 60000)) return 'Failed'
    return 'Completed'
  }

  return (
    <div className="flex-1 overflow-auto bg-[#243119] min-h-screen">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Generation History</h1>
          <p className="text-white/60">View all AI-generated captions and model responses.</p>
        </div>

        {/* Table Container */}
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 w-16">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
                      <ImageIcon className="h-3 w-3" />
                      Image
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
                      <Clock className="h-3 w-3" />
                      Created At
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
                      <Activity className="h-3 w-3" />
                      Status
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
                      <Activity className="h-3 w-3" />
                      Caption / Response
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
                      <Cpu className="h-3 w-3" />
                      Model
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
                      <MoreHorizontal className="h-3 w-3" />
                      Actions
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history?.map((item) => {
                  const imageUrl = (item.caption_requests as any)?.images?.url
                  const imageId = (item.caption_requests as any)?.image_id
                  const status = getStatus(item)
                  
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="h-12 w-12 rounded-lg bg-white/10 overflow-hidden border border-white/10 shadow-sm transition-transform group-hover:scale-105">
                          {imageUrl ? (
                            <img src={imageUrl} alt="Ref" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-white/20">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/50 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{new Date(item.created_datetime_utc).toLocaleDateString()}</span>
                          <span className="text-[10px] text-white/30">{new Date(item.created_datetime_utc).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {status === 'Completed' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        ) : status === 'Pending' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-500/20">
                            <AlertCircle className="h-3 w-3" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <div className="text-sm text-white font-medium line-clamp-3 group-hover:line-clamp-none transition-all duration-300 bg-white/5 p-3 rounded-xl border border-white/10">
                          {parseResponse(item.llm_model_response) || 'No response recorded'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20 shadow-sm whitespace-nowrap">
                          {(item.llm_models as any)?.name || `ID: ${item.llm_model_id}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ReRunAction imageId={imageId} />
                      </td>
                    </tr>
                  )
                })}
                {(!history || history.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-white/40 italic">
                      No generation history found.
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
