import { adminSupabase } from '@/lib/admin-supabase'
import { Trophy, Star, MessageSquare, TrendingUp, RefreshCcw, ImageIcon, BarChart3, Activity } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ScoreFrequencyChart } from '@/components/DashboardCharts'

export const revalidate = 0 // Data should be fresh

export default async function StatisticsPage() {
  // 1. Fetch Key Metrics
  
  // Total Captions
  const { count: totalCaptions } = await adminSupabase
    .from('captions')
    .select('*', { count: 'exact', head: true })

  // 2. Fetch all from caption_scores with pagination handling
  let allScoreRecords: any[] = []
  let fromS = 0
  let toS = 999
  let hasMoreS = true

  while (hasMoreS) {
    const { data: batch, error: batchError } = await adminSupabase
      .from('caption_scores')
      .select('total_votes')
      .range(fromS, toS)

    if (batchError) {
      console.error('Error fetching caption_scores:', batchError.message)
      hasMoreS = false
    } else {
      if (batch && batch.length > 0) {
        allScoreRecords = [...allScoreRecords, ...batch]
        fromS += 1000
        toS += 1000
        if (batch.length < 1000) hasMoreS = false
      } else {
        hasMoreS = false
      }
    }
  }

  // Group by score (total_votes)
  const scoreFrequencyMap: Record<number, number> = {}
  allScoreRecords.forEach(r => {
    const score = Math.floor(r.total_votes || 0) // Ensure integer
    if (score !== 0) { // Filter out 0 scores as requested
      scoreFrequencyMap[score] = (scoreFrequencyMap[score] || 0) + 1
    }
  })

  const scoreChartData = Object.entries(scoreFrequencyMap)
    .map(([score, freq]) => ({ score: parseInt(score), frequency: freq }))
    .sort((a, b) => a.score - b.score)

  // Average User Rating
  const { data: allVotes } = await adminSupabase
    .from('caption_votes')
    .select('vote_value')

  const totalVotesCount = allVotes?.length || 0
  const avgRating = totalVotesCount > 0 
    ? (allVotes!.reduce((acc, v) => acc + (v.vote_value || 0), 0) / totalVotesCount).toFixed(2)
    : '0.00'

  // Top Performing Flavor
  const [captionsRes, flavorsRes] = await Promise.all([
    adminSupabase
      .from('captions')
      .select('id, humor_flavor_id, caption_votes(vote_value)'),
    adminSupabase
      .from('humor_flavors')
      .select('id, name')
  ])

  const captions = captionsRes.data || []
  const flavors = flavorsRes.data || []
  const flavorMap = new Map(flavors.map(f => [f.id, f.name]))

  const flavorStats: Record<number, { sum: number, count: number }> = {}
  
  captions.forEach(cap => {
    const fid = (cap as any).humor_flavor_id
    if (fid) {
      if (!flavorStats[fid]) flavorStats[fid] = { sum: 0, count: 0 }
      const votes = (cap.caption_votes as any[]) || []
      votes.forEach(v => {
        flavorStats[fid].sum += v.vote_value
        flavorStats[fid].count++
      })
    }
  })

  let topFlavorName = 'N/A'
  let topFlavorAvg = 0
  
  Object.entries(flavorStats).forEach(([fid, stats]) => {
    if (stats.count > 0) {
      const avg = stats.sum / stats.count
      if (avg > topFlavorAvg) {
        topFlavorAvg = avg
        topFlavorName = flavorMap.get(Number(fid)) || 'Unknown'
      }
    }
  })

  // Leaderboard: Top 5
  const aggregatedCaptions = captions.map(cap => {
    const votes = (cap.caption_votes as any[]) || []
    const sum = votes.reduce((acc, v) => acc + v.vote_value, 0)
    const count = votes.length
    return {
      ...cap,
      avgScore: count > 0 ? sum / count : 0,
      totalVotes: count
    }
  })
  .sort((a, b) => b.avgScore - a.avgScore || b.totalVotes - a.totalVotes)
  .slice(0, 5)

  const topIds = aggregatedCaptions.map(c => c.id)
  const { data: leaderboardData } = await adminSupabase
    .from('captions')
    .select(`
      id,
      content,
      images (url)
    `)
    .in('id', topIds)

  const leaderboard = aggregatedCaptions.map(ac => {
    const full = leaderboardData?.find(f => f.id === ac.id)
    return {
      ...ac,
      content: full?.content,
      imageUrl: (full?.images as any)?.url
    }
  })

  return (
    <div className="flex-1 bg-[#243119] min-h-screen p-8 text-white pb-20 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl italic font-black uppercase tracking-widest text-white">Engagement Stats</h1>
            <p className="text-white/50 font-medium italic">Comprehensive overview of user interactions and content performance.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Total Processed Badge */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/50">Total Processed</span>
                <span className="text-sm font-black text-emerald-400">{allScoreRecords.length.toLocaleString()}</span>
              </div>
            </div>

            <form action={async () => {
              'use server'
              revalidatePath('/admin/statistics')
            }}>
              <button 
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
            </form>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-white/5 group-hover:text-white/10 transition-colors">
              <MessageSquare className="h-24 w-24" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Total Captions</p>
            <h2 className="text-5xl font-black italic text-white">{totalCaptions?.toLocaleString() || 0}</h2>
            <div className="mt-4 flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              <TrendingUp className="h-3 w-3" />
              Generated to date
            </div>
          </div>

          <div className="bg-white/5 p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-white/5 group-hover:text-white/10 transition-colors">
              <Star className="h-24 w-24" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Avg User Rating</p>
            <h2 className="text-5xl font-black italic text-emerald-400">{avgRating}</h2>
            <div className="mt-4 flex items-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest">
              From {totalVotesCount.toLocaleString()} total votes
            </div>
          </div>

          <div className="bg-white/5 p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-white/5 group-hover:text-white/10 transition-colors">
              <Trophy className="h-24 w-24" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Top Flavor</p>
            <h2 className="text-4xl font-black italic text-white uppercase truncate">{topFlavorName}</h2>
            <div className="mt-4 flex items-center gap-2 text-yellow-400 text-[10px] font-black uppercase tracking-widest">
              Rating: {topFlavorAvg.toFixed(2)} / 5.0
            </div>
          </div>
        </div>

        {/* Charts & Leaderboard Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Score Frequency Distribution */}
          <div className="bg-slate-950 p-8 rounded-3xl border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-xl">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl italic font-black uppercase tracking-widest text-white">Score Frequency</h3>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Aggregate caption score distribution</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-white/40">
                Score Range
              </div>
            </div>

            <ScoreFrequencyChart data={scoreChartData} />
            <p className="mt-4 text-[10px] text-white/20 font-bold uppercase tracking-widest text-center italic">
              Captions with aggregate score equals to 0 is not included
            </p>
          </div>

          {/* Hall of Fame / Leaderboard */}
          <div className="bg-slate-950 p-8 rounded-3xl border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl italic font-black uppercase tracking-widest text-white">Leaderboard</h3>
              <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-white/40">
                Top 5 Rated
              </div>
            </div>

            <div className="space-y-4">
              {leaderboard.length > 0 ? leaderboard.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all group">
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className={`text-lg font-black italic ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-600' : 'text-white/20'}`}>
                      #{idx + 1}
                    </span>
                  </div>
                  
                  <div className="h-12 w-12 rounded-xl bg-black/40 overflow-hidden border border-white/10 flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <ImageIcon className="h-5 w-5 text-white/10" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate italic group-hover:text-emerald-400 transition-colors">
                      &quot;{item.content}&quot;
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                        Avg Score: {item.avgScore.toFixed(2)}
                      </span>
                      <span className="text-white/10">•</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                        {item.totalVotes} Votes
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <Star className="h-3 w-3 fill-emerald-400 text-emerald-400" />
                    <span className="text-xs font-black text-emerald-400">{item.avgScore.toFixed(1)}</span>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-white/20 italic font-black uppercase tracking-widest">
                  No rated captions yet.
                </div>
              )}
            </div>
            
            <div className="mt-8 text-center">
              <Link 
                href="/admin/content" 
                className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-emerald-400 transition-colors"
              >
                View all content →
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
