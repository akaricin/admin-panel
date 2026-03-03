import { adminSupabase } from '@/lib/admin-supabase'
import { VoteVolumeBarChart, LLMPerformanceScatterPlot } from '@/components/DashboardCharts'
import { format, subHours, subDays, startOfHour } from 'date-fns'
import { Trophy, BarChart3, Activity } from 'lucide-react'

export const revalidate = 60 // Revalidate every minute

export default async function AdminDashboard() {
  const now = new Date()
  const twentyFourHoursAgo = subHours(now, 24)
  const tenDaysAgo = subDays(now, 10)

  // 1. Fetch Vote Volume for last 10 days
  const { data: votes } = await adminSupabase
    .from('caption_votes')
    .select('created_at')
    .gte('created_at', tenDaysAgo.toISOString())

  // Group by day
  const dailyVotesMap = new Map<string, number>()
  for (let i = 0; i < 10; i++) {
    // Generate date labels in UTC context
    const date = subDays(now, i)
    const dayLabel = format(date, 'MMM dd')
    dailyVotesMap.set(dayLabel, 0)
  }

  votes?.forEach(v => {
    const date = new Date(v.created_at)
    const dayLabel = format(date, 'MMM dd')
    if (dailyVotesMap.has(dayLabel)) {
      dailyVotesMap.set(dayLabel, (dailyVotesMap.get(dayLabel) || 0) + 1)
    }
  })

  const votesChartData = Array.from(dailyVotesMap.entries())
    .map(([day, count]) => ({ hour: day, count })) // 'hour' key kept for component compatibility
    .reverse()

  // 2. Fetch LLM Scatter Plot Data (Last 24h)
  const { data: latency } = await adminSupabase
    .from('llm_model_responses')
    .select('processing_time_seconds, created_datetime_utc, llm_model_id')
    .gte('created_datetime_utc', twentyFourHoursAgo.toISOString())
    .order('created_datetime_utc', { ascending: true })

  const modelIds = Array.from(new Set(latency?.map(l => l.llm_model_id) || []))
  
  const scatterData = latency?.map(l => ({
    timestamp: new Date(l.created_datetime_utc).getTime(),
    processingTime: l.processing_time_seconds,
    modelId: l.llm_model_id
  })) || []

  // 3. Top Captions (Hall of Fame)
  const { data: topCaptionsData } = await adminSupabase
    .from('captions')
    .select(`
      id,
      content,
      image_id,
      images (url),
      caption_votes (vote_value)
    `)

  const aggregatedCaptions = topCaptionsData?.map(cap => {
    const votes = (cap.caption_votes as any[] || [])
    const sum = votes.reduce((acc, v) => acc + (v.vote_value || 0), 0)
    const count = votes.length
    return {
      id: cap.id,
      content: cap.content,
      imageUrl: (cap.images as any)?.url,
      totalValue: sum,
      totalCount: count
    }
  }) || []

  const top3 = aggregatedCaptions
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 3)

  const rankStyles = [
    { border: 'border-yellow-400', badge: 'bg-yellow-400', label: '1st Place' },
    { border: 'border-gray-400', badge: 'bg-gray-400', label: '2nd Place' },
    { border: 'border-amber-600', badge: 'bg-amber-600', label: '3rd Place' }
  ]

  return (
    <div className="flex-1 overflow-auto bg-[#243119]">
      <div className="p-8 max-w-7xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-white/70 mt-1">24-hour analytics and performance overview (UTC).</p>
        </div>

        {/* Row 1: 24-Hour Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vote Volume Chart */}
          <div className="bg-white/5 p-6 rounded-2xl shadow-sm border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Vote Volume</h3>
                <p className="text-xs text-white/50">Number of votes cast (last 10 days)</p>
              </div>
            </div>
            <VoteVolumeBarChart data={votesChartData} />
          </div>

          {/* LLM Scatter Plot */}
          <div className="bg-white/5 p-6 rounded-2xl shadow-sm border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/10 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">LLM Response Latency</h3>
                <p className="text-xs text-white/50">Processing time per request (last 24h)</p>
              </div>
            </div>
            <LLMPerformanceScatterPlot data={scatterData} modelIds={modelIds} />
          </div>
        </div>

        {/* Row 2: Top Captions */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-yellow-50/10 rounded-lg">
              <Trophy className="h-6 w-6 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Hall of Fame</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {top3.map((cap, index) => (
              <div 
                key={cap.id}
                className={`group bg-white/5 rounded-3xl overflow-hidden border-2 ${rankStyles[index].border} shadow-lg transition-transform hover:scale-[1.02] duration-300 relative`}
              >
                {/* Image Section */}
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={cap.imageUrl} 
                    alt="Caption Background"
                    className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#243119]/80 to-transparent" />
                  <div className={`absolute top-4 left-4 ${rankStyles[index].badge} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg`}>
                    {rankStyles[index].label}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <p className="text-white font-medium leading-relaxed mb-6 italic min-h-[3rem]">
                    "{cap.content}"
                  </p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-2xl font-black text-white">{cap.totalValue}</p>
                      <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Sum Score</p>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="text-center">
                      <p className="text-2xl font-black text-white">{cap.totalCount}</p>
                      <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Vote Count</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
