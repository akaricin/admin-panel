import { Loader2 } from 'lucide-react'

export default function StatisticsLoading() {
  return (
    <div className="flex-1 bg-[#243119] min-h-screen p-8 flex flex-col items-center justify-center text-emerald-400">
      <div className="relative">
        <Loader2 className="h-16 w-16 animate-spin opacity-20" />
        <Loader2 className="h-16 w-16 animate-spin absolute top-0 left-0" style={{ animationDuration: '3s' }} />
      </div>
      <h2 className="mt-8 text-xl font-black uppercase tracking-[0.3em] animate-pulse italic">
        Aggregating Engagement Data...
      </h2>
      <p className="text-white/30 text-xs font-bold uppercase tracking-widest mt-4">
        This might take a moment for large datasets
      </p>
    </div>
  )
}
